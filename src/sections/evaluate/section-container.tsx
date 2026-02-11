import React, { useState } from "react";

import {
  Box,
  Button,
  Paper,
  Grid,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";

import Drafting from "./drafting";
import Criteria from "./criteria-group";
import FormContent from "./form-content";

// ========================
// Kiểu dữ liệu Section
// ========================
interface Section {
  id: number;
  title: string;
  type: "table" | "draft" | "content";
}

interface SectionContainerProps {
  sections: any[];
  onAddSection: (section: any) => void;
  onDeleteSection: (id: number) => void;
  onUpdateSection?: (id: number, updates: Partial<any>) => void; // thêm dòng này
}


// ========================
// Component con: SectionItem
// ========================
const SectionItem: React.FC<{
  section: Section;
  onDelete: () => void;
  onUpdateSection?: (id: number, updates: Partial<any>) => void; // thêm dòng này
}> = ({ section, onDelete, onUpdateSection }) => {
  const [hasTitle, setHasTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true); // true = đang nhập

  const handleToggleEdit = () => {
    if (isEditing) {
      // Lưu
      if (customTitle.trim() !== "") setIsEditing(false);
    } else {
      // Sửa
      setIsEditing(true);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          backgroundColor: "grey.50",
        }}
      >
        <Grid container sx={{ mb: 1 }} alignItems="center">
  <Typography
    variant="h6"
    fontWeight={600}
    sx={{
      color: "primary.main",
      fontSize: 20,
      mb: 1,
    }}
  >
    {section.title}
  </Typography>
</Grid>
        {/* ==================== */}
        {/* Hàng tiêu đề + nút xóa */}
        {/* ==================== */}
        <Grid container sx={{ mb: 1 }} alignItems="center">
          {/* Trái: Tiêu đề + Lưu/Sửa + Checkbox */}
          <Grid
            size={{ xs: 6 }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {/* Khi bật “Thêm tiêu đề” */}
            {hasTitle && (
              <>
                {isEditing ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <TextField
                      size="small"
                      label="Tiêu đề mục"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      sx={{ width: 250 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleToggleEdit}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: 13,
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.4,
                        minWidth: 55,
                      }}
                    >
                      Lưu
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: "black",
                        fontSize: 22,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {customTitle || "(Chưa có tiêu đề)"}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleToggleEdit}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: 13,
                        borderRadius: 2,
                        px: 1.0,
                        py: 0.4,
                        ml: 2,
                        minWidth: 55,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: (theme) => theme.palette.primary.dark,
                        },
                      }}
                    >
                      Sửa
                    </Button>
                  </Box>
                )}
              </>
            )}

            {/* Checkbox luôn hiển thị */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={hasTitle}
                  onChange={(e) => {
                    setHasTitle(e.target.checked);
                    setIsEditing(true);
                  }}
                />
              }
              label="Thêm tiêu đề"
              sx={{ m: 0, ml: 1 }}
            />
          </Grid>

          {/* Giữa trống */}
          <Grid size={{ xs: 5 }} />

          {/* Phải: Nút Xóa */}
          <Grid
            size={{ xs: 1 }}
            sx={{
              textAlign: "right",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="outlined"
              color="error"
              size="small"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                minWidth: 80,
                px: 2,
                py: 0.5,
              }}
              onClick={onDelete}
            >
              🗑 Xóa
            </Button>
          </Grid>
        </Grid>

        {/* ==================== */}
        {/* Nội dung từng loại mục */}
        {/* ==================== */}
{section.type === "table" && (
<Criteria
  sectionTitle={section.title}
  onChange={(groups) => onUpdateSection?.(section.id, { groups })}
/>
)}

{section.type === "draft" && (
  <Drafting
    sectionTitle={section.title}
    onChange={(content) => onUpdateSection?.(section.id, { content })}
  />
)}

{section.type === "content" && (
  <FormContent
    sectionTitle={section.title}
    onChange={(data) => onUpdateSection?.(section.id, { content: data })}
  />
)}



      </Box>
    </Box>
  );
};

// ========================
// Component chính
// ========================
const SectionContainer: React.FC<SectionContainerProps> = ({
  sections,
  onAddSection,
  onDeleteSection,
  onUpdateSection, 
}) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (type: "table" | "draft" | "content") => {
    const newSection: Section = {
      id: Date.now(),
      title:
        type === "table"
          ? "Mục bảng"
          : type === "draft"
            ? "Mục soạn thảo"
            : "Mục nội dung",
      type,
    };
    onAddSection(newSection);
    setIsAdding(false);
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      {/* Danh sách các mục */}
      {sections.map((section) => (
  <SectionItem
    key={section.id}
    section={section}
    onDelete={() => onDeleteSection(section.id)}
    onUpdateSection={onUpdateSection}  
  />
))}

      {/* Nút thêm mục */}
      {!isAdding ? (
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          sx={{
            mt: 2,
            textTransform: "none",
            borderRadius: 3,
            fontWeight: 600,
          }}
          onClick={() => setIsAdding(true)}
        >
          ➕ Thêm mục lớn
        </Button>
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid
            size={{ xs: 12 }}
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              color="info"
              onClick={() => handleAdd("draft")}
              sx={{
                minWidth: 150,
                textTransform: "none",
                fontWeight: 600,
                py: 1,
                borderRadius: 3,
              }}
            >
               Soạn thảo
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={() => handleAdd("table")}
              sx={{
                minWidth: 150,
                textTransform: "none",
                fontWeight: 600,
                py: 1,
                borderRadius: 3,
              }}
            >
               Tạo bảng
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={() => handleAdd("content")}
              sx={{
                minWidth: 150,
                textTransform: "none",
                fontWeight: 600,
                py: 1,
                borderRadius: 3,
              }}
            >
               Tạo nội dung
            </Button>
          </Grid>

          <Grid size={{ xs: 12 }} sx={{ textAlign: "center" }}>
            <Button
              onClick={() => setIsAdding(false)}
              sx={{
                color: "text.secondary",
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              ✖ Hủy
            </Button>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default SectionContainer;
