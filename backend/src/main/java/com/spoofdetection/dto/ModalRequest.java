package com.spoofdetection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModalRequest {

    @JsonProperty("youtube_url")
    private String youtubeUrl;

    @JsonProperty("audio_b64")
    private String audioB64;

    private String filename;

    private List<String> models;
}
