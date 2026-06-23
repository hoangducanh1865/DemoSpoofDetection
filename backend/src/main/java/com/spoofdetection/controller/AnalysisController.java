package com.spoofdetection.controller;

import com.spoofdetection.dto.AnalysisJobDto;
import com.spoofdetection.dto.YouTubeRequest;
import com.spoofdetection.service.AnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/analyze")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    /**
     * Analyze audio from a YouTube URL.
     */
    @PostMapping("/youtube")
    public ResponseEntity<AnalysisJobDto> analyzeYouTube(@Valid @RequestBody YouTubeRequest request) {
        AnalysisJobDto result = analysisService.analyzeYouTube(request.getUrl(), request.getModels());
        return ResponseEntity.ok(result);
    }

    /**
     * Analyze an uploaded audio file.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnalysisJobDto> analyzeUpload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "use_case", required = false) String useCase,
            @RequestParam(value = "models", required = false) List<String> models) {
        AnalysisJobDto result = analysisService.analyzeUpload(file, useCase, models);
        return ResponseEntity.ok(result);
    }

    /**
     * Get a single analysis job by ID.
     */
    @GetMapping("/{jobId}")
    public ResponseEntity<AnalysisJobDto> getJob(@PathVariable UUID jobId) {
        return analysisService.getJob(jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get paginated analysis history, most recent first.
     */
    @GetMapping("/history")
    public ResponseEntity<Page<AnalysisJobDto>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AnalysisJobDto> history = analysisService.getHistory(pageRequest);
        return ResponseEntity.ok(history);
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "OK"));
    }
}
