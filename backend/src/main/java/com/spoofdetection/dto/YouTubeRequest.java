package com.spoofdetection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.List;

@Data
public class YouTubeRequest {

    @NotBlank
    @Pattern(regexp = "^https?://(www\\.)?(youtube\\.com/watch|youtu\\.be/).*$",
             message = "Only YouTube URLs supported")
    private String url;

    private List<String> models;
}
