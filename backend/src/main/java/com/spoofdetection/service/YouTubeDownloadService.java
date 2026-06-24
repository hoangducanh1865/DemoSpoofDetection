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

    public byte[] downloadAudio(String youtubeUrl) throws IOException, InterruptedException {
        Path tmpDir = Files.createTempDirectory("yt-audio-");
        Path outputTemplate = tmpDir.resolve("audio.%(ext)s");
        Path wavFile = tmpDir.resolve("audio.wav");

        try {
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
            String output = new String(proc.getInputStream().readAllBytes());
            boolean finished = proc.waitFor(120, TimeUnit.SECONDS);

            if (!finished) {
                proc.destroyForcibly();
                throw new IOException("yt-dlp timeout after 120s");
            }

            if (proc.exitValue() != 0) {
                log.error("yt-dlp failed: {}", output);
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
