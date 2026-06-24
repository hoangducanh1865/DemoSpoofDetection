package com.spoofdetection.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Converter;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.AttributeConverter;
import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "analysis_jobs")
public class AnalysisJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Convert(converter = JobStatusConverter.class)
    @Column(name = "status", nullable = false)
    private JobStatus status;

    @Column(name = "use_case")
    private String useCase;

    @Column(name = "input_reference")
    private String inputReference;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_molex", columnDefinition = "jsonb")
    private ModelResultJson resultMolex;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_aasist", columnDefinition = "jsonb")
    private ModelResultJson resultAasist;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "total_processing_ms")
    private Integer totalProcessingMs;

    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = JobStatus.PENDING;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // --- Enum ---

    public enum JobStatus {
        PENDING, PROCESSING, DONE, FAILED
    }

    // --- JPA Converter for lowercase DB values ---

    @Converter(autoApply = false)
    public static class JobStatusConverter implements AttributeConverter<JobStatus, String> {

        @Override
        public String convertToDatabaseColumn(JobStatus status) {
            if (status == null) {
                return null;
            }
            return status.name().toLowerCase();
        }

        @Override
        public JobStatus convertToEntityAttribute(String dbValue) {
            if (dbValue == null) {
                return null;
            }
            return JobStatus.valueOf(dbValue.toUpperCase());
        }
    }

    // --- Inner JSON classes for JSONB columns ---

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelResultJson implements Serializable {
        private String label;
        private Double confidence;
        private Double spoofProbability;
        private List<SegmentJson> segments;
        private Integer segmentsAnalyzed;
        private Double totalDurationSec;
        private Integer processingMs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SegmentJson implements Serializable {
        private Integer pct;
        private String label;
        private Double confidence;
    }
}
