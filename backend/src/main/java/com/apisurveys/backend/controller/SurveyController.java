package com.apisurveys.backend.controller;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class SurveyController {


    @GetMapping("/classes")
    public List<SchoolClassDto> getClasses() {


        return List.of();
    }


    @GetMapping("/classes/{classId}/blocks")
    public List<SurveyBlockDto> getBlocks(
            @PathVariable Long classId
    ) {


        return List.of();
    }


    @GetMapping("/surveys/questions")
    public List<QuestionDto> getQuestions() {

        return List.of();
    }



    @PostMapping("/admin/surveys")
    public String createSurvey(
            @RequestBody CreateSurveyRequest request
    ) {

        return "Utworzono ankietę dla klasy ID: "
                + request.classId();
    }


    public record SchoolClassDto(
            Long id,
            String name
    ) {}

    public record SurveyBlockDto(
            Long id,
            String teacherName,
            String subjectName,
            String module
    ) {}

    public record QuestionDto(
            String code,
            String content
    ) {}

    public record CreateSurveyRequest(
            Long classId,
            String startDate,
            String endDate
    ) {}
}