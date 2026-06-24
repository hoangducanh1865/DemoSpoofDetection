package com.spoofdetection.service;

import com.spoofdetection.dto.AnalysisJobDto;
import com.spoofdetection.dto.ModalRequest;
import com.spoofdetection.dto.ModalResponse;
import com.spoofdetection.entity.AnalysisJob;
import com.spoofdetection.entity.AnalysisJob.JobStatus;
import com.spoofdetection.entity.AnalysisJob.ModelResultJson;
import com.spoofdetection.entity.AnalysisJob.SegmentJson;
import com.spoofdetection.repository.AnalysisJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final AnalysisJobRepository jobRepository;
    private final ModalInferenceService modalInferenceService;

    @Value("${app.default-models}")
    private String defaultModels;

    /**
     * Analyze audio from a YouTube URL.
     */
    public AnalysisJobDto analyzeYouTube(String url, List<String> models) {
        List<String> resolvedModels = resolveModels(models);

        AnalysisJob job = AnalysisJob.builder()
                .status(JobStatus.PENDING)
                .useCase("youtube_url")
                .inputReference(url)
                .build();
        job = jobRepository.save(job);

        try {
            job.setStatus(JobStatus.PROCESSING);
            job = jobRepository.save(job);

            ModalRequest modalRequest = ModalRequest.builder()
                    .youtubeUrl(url)
                    .models(resolvedModels)
                    .build();

            ModalResponse response = modalInferenceService.callInference(modalRequest);
            applyResults(job, response);

            job.setStatus(JobStatus.DONE);
            job = jobRepository.save(job);

        } catch (Exception e) {
            log.error("YouTube analysis failed for job {}: {}", job.getId(), e.getMessage(), e);
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job = jobRepository.save(job);
        }

        return AnalysisJobDto.from(job);
    }

    /**
     * Analyze an uploaded audio file.
     */
    public AnalysisJobDto analyzeUpload(MultipartFile file, String useCase, List<String> models) {
        List<String> resolvedModels = resolveModels(models);

        String resolvedUseCase = useCase != null && !useCase.isBlank() ? useCase : "file_upload";

        AnalysisJob job = AnalysisJob.builder()
                .status(JobStatus.PENDING)
                .useCase(resolvedUseCase)
                .inputReference(file.getOriginalFilename())
                .fileSizeBytes(file.getSize())
                .build();
        job = jobRepository.save(job);

        try {
            job.setStatus(JobStatus.PROCESSING);
            job = jobRepository.save(job);

            byte[] fileBytes = file.getBytes();
            String audioBase64 = Base64.getEncoder().encodeToString(fileBytes);

            ModalRequest modalRequest = ModalRequest.builder()
                    .audioB64(audioBase64)
                    .filename(file.getOriginalFilename())
                    .models(resolvedModels)
                    .build();

            ModalResponse response = modalInferenceService.callInference(modalRequest);
            applyResults(job, response);

            job.setStatus(JobStatus.DONE);
            job = jobRepository.save(job);

        } catch (Exception e) {
            log.error("Upload analysis failed for job {}: {}", job.getId(), e.getMessage(), e);
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job = jobRepository.save(job);
        }

        return AnalysisJobDto.from(job);
    }

    /**
     * Get a single job by ID.
     */
    public Optional<AnalysisJobDto> getJob(UUID jobId) {
        return jobRepository.findById(jobId).map(AnalysisJobDto::from);
    }

    /**
     * Get paginated history of all jobs.
     */
    public Page<AnalysisJobDto> getHistory(Pageable pageable) {
        return jobRepository.findAll(pageable).map(AnalysisJobDto::from);
    }

    // --- Private helpers ---

    private List<String> resolveModels(List<String> models) {
        if (models != null && !models.isEmpty()) {
            return models;
        }
        return Arrays.asList(defaultModels.split(","));
    }

    private void applyResults(AnalysisJob job, ModalResponse response) {
        int totalMs = 0;

        if (response.getMolex() != null) {
            job.setResultMolex(toModelResultJson(response.getMolex()));
            totalMs += response.getMolex().getProcessingMs();
        }

        if (response.getAasist() != null) {
            job.setResultAasist(toModelResultJson(response.getAasist()));
            totalMs += response.getAasist().getProcessingMs();
        }

        job.setTotalProcessingMs(totalMs);
    }

    private ModelResultJson toModelResultJson(ModalResponse.ModelResult mr) {
        List<SegmentJson> segments = null;
        if (mr.getSegments() != null) {
            segments = mr.getSegments().stream()
                    .map(s -> SegmentJson.builder()
                            .startSec(s.getStartSec())
                            .endSec(s.getEndSec())
                            .label(s.getLabel())
                            .confidence(s.getConfidence())
                            .build())
                    .toList();
        }

        return ModelResultJson.builder()
                .label(mr.getLabel())
                .confidence(mr.getConfidence())
                .spoofProbability(mr.getSpoofProbability())
                .segments(segments)
                .segmentsAnalyzed(mr.getSegmentsAnalyzed())
                .totalDurationSec(mr.getTotalDurationSec())
                .processingMs(mr.getProcessingMs())
                .build();
    }
}
