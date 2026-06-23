package com.spoofdetection.service;

import com.spoofdetection.dto.ModalRequest;
import com.spoofdetection.dto.ModalResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Service
@Slf4j
public class ModalInferenceService {

    private final WebClient webClient;
    private final String inferenceUrl;
    private final int timeoutSeconds;

    public ModalInferenceService(
            WebClient webClient,
            @Value("${app.modal.inference-url}") String inferenceUrl,
            @Value("${app.modal.timeout-seconds}") int timeoutSeconds) {
        this.webClient = webClient;
        this.inferenceUrl = inferenceUrl;
        this.timeoutSeconds = timeoutSeconds;
    }

    /**
     * Call the Modal inference endpoint and return the parsed response.
     */
    public ModalResponse callInference(ModalRequest request) {
        log.info("Calling Modal inference at {} with models={}", inferenceUrl, request.getModels());

        ModalResponse response = webClient.post()
                .uri(inferenceUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ModalResponse.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .block();

        log.info("Modal inference completed successfully");
        return response;
    }
}
