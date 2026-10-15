package com.bmb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BmbApplication {
    public static void main(String[] args) {
        SpringApplication.run(BmbApplication.class, args);
    }
}
