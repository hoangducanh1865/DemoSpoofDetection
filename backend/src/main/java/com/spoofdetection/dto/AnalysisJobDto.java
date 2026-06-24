package com.spoofdetection.dto;

import com.spoofdetection.entity.AnalysisJob;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisJobDto {

    private UUID id;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private String status;
    private String useCase;
    private String inputReference;
    private Long fileSizeBytes;
    private ModelResultDto resultMolex;
    private ModelResultDto resultAasist;
    private String errorMessage;
    private Integer totalProcessingMs;

    public static AnalysisJobDto from(AnalysisJob job) {
        return AnalysisJobDto.builder()
                .id(job.getId())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .status(job.getStatus() != null ? job.getStatus().name().toLowerCase() : null)
                .useCase(job.getUseCase())
                .inputReference(job.getInputReference())
                .fileSizeBytes(job.getFileSizeBytes())
                .resultMolex(toModelResultDto(job.getResultMolex()))
                .resultAasist(toModelResultDto(job.getResultAasist()))
                .errorMessage(job.getErrorMessage())
                .totalProcessingMs(job.getTotalProcessingMs())
                .build();
    }

    private static ModelResultDto toModelResultDto(AnalysisJob.ModelResultJson json) {
        if (json == null) {
            return null;
        }
        return ModelResultDto.builder()
                .label(json.getLabel())
                .confidence(json.getConfidence())
                .spoofProbability(json.getSpoofProbability())
                .segments(json.getSegments() != null
                        ? json.getSegments().stream().map(s ->
                            SegmentDto.builder()
                                    .startSec(s.getStartSec())
                                    .endSec(s.getEndSec())
                                    .label(s.getLabel())
                                    .confidence(s.getConfidence())
                                    .build()
                        ).toList()
                        : null)
                .segmentsAnalyzed(json.getSegmentsAnalyzed())
                .totalDurationSec(json.getTotalDurationSec())
                .processingMs(json.getProcessingMs())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelResultDto {
        private String label;
        private Double confidence;
        private Double spoofProbability;
        private List<SegmentDto> segments;
        private Integer segmentsAnalyzed;
        private Double totalDurationSec;
        private Integer processingMs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SegmentDto {
        private Double startSec;
        private Double endSec;
        private String label;
        private Double confidence;
    }
}
