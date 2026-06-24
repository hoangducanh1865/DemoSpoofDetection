package com.spoofdetection.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class YouTubeDownloadService {

    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 3000;

    public byte[] downloadAudio(String youtubeUrl) throws IOException, InterruptedException {
        Path tmpDir = Files.createTempDirectory("yt-audio-");
        Path outputTemplate = tmpDir.resolve("audio.%(ext)s");
        Path wavFile = tmpDir.resolve("audio.wav");

        try {
            String output = null;
            int exitCode = -1;

            for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                for (Path f : Files.list(tmpDir).filter(p -> !Files.isDirectory(p)).toArray(Path[]::new)) {
                    Files.deleteIfExists(f);
                }

                ProcessBuilder pb = new ProcessBuilder(
                        "yt-dlp", "-x", "--audio-format", "wav",
                        "--audio-quality", "0", "--no-playlist",
                        "--no-check-certificates",
                        "--socket-timeout", "30",
                        "-o", outputTemplate.toString(),
                        youtubeUrl
                );
                pb.redirectErrorStream(true);
                Process proc = pb.start();
                output = new String(proc.getInputStream().readAllBytes());
                boolean finished = proc.waitFor(120, TimeUnit.SECONDS);

                if (!finished) {
                    proc.destroyForcibly();
                    if (attempt < MAX_RETRIES) {
                        log.warn("yt-dlp timeout on attempt {}/{}, retrying...", attempt, MAX_RETRIES);
                        Thread.sleep(RETRY_DELAY_MS);
                        continue;
                    }
                    throw new IOException("yt-dlp timeout after 120s");
                }

                exitCode = proc.exitValue();
                if (exitCode == 0) break;

                if (attempt < MAX_RETRIES && (output.contains("403") || output.contains("429"))) {
                    log.warn("yt-dlp got HTTP {}, retry {}/{}...",
                            output.contains("403") ? "403" : "429", attempt, MAX_RETRIES);
                    Thread.sleep(RETRY_DELAY_MS * attempt);
                    continue;
                }
            }

            if (exitCode != 0) {
                log.error("yt-dlp failed after {} attempts: {}", MAX_RETRIES, output);
                throw new IOException("YouTube download failed: " + output.substring(0, Math.min(output.length(), 800)));
            }

            if (!Files.exists(wavFile)) {
                Path[] files = Files.list(tmpDir).filter(p -> !Files.isDirectory(p)).toArray(Path[]::new);
                if (files.length == 0) {
                    throw new IOException("No audio file downloaded");
                }
                Path src = files[0];
                ProcessBuilder ffmpeg = new ProcessBuilder(
                        "ffmpeg", "-i", src.toString(),
                        "-ar", "16000", "-ac", "1", wavFile.toString()
                );
                ffmpeg.redirectErrorStream(true);
                Process ffProc = ffmpeg.start();
                ffProc.getInputStream().readAllBytes();
                ffProc.waitFor(60, TimeUnit.SECONDS);
            }

            return Files.readAllBytes(wavFile);
        } finally {
            Files.walk(tmpDir)
                    .sorted(java.util.Comparator.reverseOrder())
                    .forEach(p -> { try { Files.delete(p); } catch (IOException ignored) {} });
        }
    }
}
