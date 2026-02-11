import React, { useState } from "react";

import { Grid, Typography, Box, Button } from "@mui/material";

import { DashboardContent } from "src/layouts/dashboard";

import SectionContainer from "../section-container";

// ===================== INTERFACES =====================

interface SubCriterionData {
  section_id: number;
  parent_id: number;
  order: number;
  max_score: number;
  content: string;
}

interface CriterionData {
  section_id: number;
  parent_id: number;
  order: number;
  max_score: number;
  content: string;
  evidence_required: number;
  is_bonus: number;
  options: number;
  sub_criteria?: SubCriterionData[];
}

interface CriteriaGroupData {
  title: string;
  parent_id: number;
  order: number;
  level: number;
  max_scores: number;
  criteria: CriterionData[];
}

interface SectionItem {
  parent_id: number;
  order: number;
  level: number;
  max_scores?: number;
  criteria_question?: {
    section_id: number;
    type: string;
    content: string;
  };
}

interface SectionData {
  id: number;
  title: string | null;
  parent_id: number | null;
  order: number;
  level: number;
  type: number | null; // 1 = soạn thảo, 2 = bảng, 3 = nội dung
  max_scores: number;
  items?: SectionItem[];
  criteria_group?: CriteriaGroupData[];
}

// ===================== COMPONENT =====================

export function CreateEvaluateView() {
  const [sections, setSections] = useState<
    {
      id: number;
      title: string;
      type: "table" | "draft" | "content";
      groups?: any[];
      content?: any; // để có thể nhận cả string hoặc object { sectionTitle, items }
    }[]
  >([]);

  // Thêm mục mới
  const handleAddSection = (section: {
    id: number;
    title: string;
    type: "table" | "content" | "draft";
  }) => {
    setSections((prev) => [...prev, section]);
  };

  // Xóa mục
  const handleDeleteSection = (id: number) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  // Cập nhật mục (fix logic)
  const handleUpdateSection = (
    id: number,
    updates: Partial<(typeof sections)[number]>
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id
          ? {
              ...section,
              ...updates,
              groups: updates.groups ?? section.groups,
              content: updates.content ?? section.content,
            }
          : section
      )
    );
  };

  // Lưu Phiếu Đánh Giá (tạo JSON chuẩn)
  const handleSaveForm = () => {
    let sectionIdCounter = 1;
    let criteriaIdCounter = 1000;
    const jsonResult: SectionData[] = [];

    sections.forEach((section, sectionIndex) => {
      const sectionId = sectionIdCounter++;
      const sectionData: SectionData = {
        id: sectionId,
        title: section.title || null,
        parent_id: null,
        order: sectionIndex + 1,
        level: 1,
        type:
          section.type === "draft"
            ? 1
            : section.type === "table"
            ? 2
            : section.type === "content"
            ? 3
            : null,
        max_scores: 0,
      };

      // ---------- TYPE = 1: SOẠN THẢO ----------
      if (section.type === "draft" && section.content) {
        sectionData.items = [
          {
            parent_id: sectionId,
            order: 1,
            level: 2,
            max_scores: 0,
            criteria_question: {
              section_id: sectionId,
              type: "paragraph",
              // Nếu content là object, lấy đúng phần data
              content:
                typeof section.content === "string"
                  ? section.content
                  : section.content?.content || "",
            },
          },
        ];
      }

      // ---------- TYPE = 2: BẢNG ----------
      if (section.type === "table" && section.groups) {
        sectionData.criteria_group = section.groups.map(
          (group: any, groupIndex: number): CriteriaGroupData => {
            const groupId = sectionIdCounter++;

            const allCriteria = [
              ...(group.regularCriteria || []),
              ...(group.listCriteria || []),
              ...(group.bonusCriteria || []),
            ];

            return {
              title: group.title,
              parent_id: sectionId,
              order: groupIndex + 1,
              level: 2,
              max_scores: group.totalScore || 0,
              criteria: allCriteria.map(
                (criterion: any, critIndex: number): CriterionData => {
                  const criterionId = criteriaIdCounter++;

                  const baseCriterion: CriterionData = {
                    section_id: sectionId,
                    parent_id: groupId,
                    order: critIndex + 1,
                    max_score: parseFloat(criterion.score) || 0,
                    content: criterion.content,
                    evidence_required: criterion.evidence ? 1 : 0,
                    is_bonus: criterion.isBonus ? 1 : 0,
                    options: criterion.subList?.length ? 1 : 0,
                  };

                  if (criterion.subList && criterion.subList.length > 0) {
                    baseCriterion.sub_criteria = criterion.subList.map(
                      (sub: any, subIndex: number): SubCriterionData => ({
                        section_id: sectionId,
                        parent_id: criterionId,
                        order: subIndex + 1,
                        max_score: parseFloat(sub.score) || 0,
                        content: sub.content,
                      })
                    );
                  }

                  return baseCriterion;
                }
              ),
            };
          }
        );
      }

      // ---------- TYPE = 3: NỘI DUNG ----------
      if (section.type === "content" && section.content?.items) {
        sectionData.items = section.content.items.map(
          (item: any, index: number) => ({
            parent_id: sectionId,
            order: index + 1,
            level: 2,
            criteria_question: {
              section_id: sectionId,
              type: "paragraph",
              content: item.content,
            },
          })
        );
      }

      jsonResult.push(sectionData);
    });

    // Tạo file JSON
    const blob = new Blob([JSON.stringify(jsonResult, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "evaluation_form.json";
    link.click();
    URL.revokeObjectURL(url);

    alert(" File evaluation_form.json đã được tạo và tải về!");
  };

  // ===================== RENDER =====================

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Tạo biểu mẫu đánh giá
          </Typography>

          <SectionContainer
            sections={sections}
            onAddSection={handleAddSection}
            onDeleteSection={handleDeleteSection}
            onUpdateSection={handleUpdateSection}
          />

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleSaveForm}
              sx={{
                px: 4,
                py: 1.2,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 3,
                fontSize: 16,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.success.dark,
                },
              }}
            >
               Lưu Phiếu Đánh Giá
            </Button>
          </Box>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}

export default CreateEvaluateView;
