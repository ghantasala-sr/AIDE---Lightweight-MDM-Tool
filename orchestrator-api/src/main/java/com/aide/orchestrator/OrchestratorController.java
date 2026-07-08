package com.aide.orchestrator;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class OrchestratorController {

    private final RestTemplate restTemplate = new RestTemplate();
    
    @org.springframework.beans.factory.annotation.Value("${PYTHON_SERVICE_URL:http://localhost:8000/profile-schema}")
    private String pythonServiceUrl;

    @PostMapping("/profile")
    public ResponseEntity<?> profileSchema(@RequestBody List<Map<String, Object>> columns) {
        try {
            // Forward the request to the Python Schema Profiler Service
            ResponseEntity<List> response = restTemplate.postForEntity(
                pythonServiceUrl,
                columns,
                List.class
            );
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error communicating with Schema Profiler: " + e.getMessage());
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Orchestrator API is running");
    }
}
