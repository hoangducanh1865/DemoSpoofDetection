package com.spoofdetection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModalResponse {

    private ModelResult molex;
    private ModelResult aasist;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelResult {
        private String label;

        @JsonProperty("spoof_probability")
        private double spoofProbability;

        private double confidence;

        private List<Segment> segments;

        @JsonProperty("segments_analyzed")
        private int segmentsAnalyzed;

        @JsonProperty("total_duration_sec")
        private double totalDurationSec;

        @JsonProperty("processing_ms")
        private int processingMs;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Segment {
        private int pct;
        private String label;
        private double confidence;
    }
}
