import React, { useState, useEffect } from "react";

import { Box, Button, Grid, TextField, Typography } from "@mui/material";

export interface ContentItem {
  id: number;
  order: number;       // 🔢 thứ tự nội dung
  content: string;
  isEditing: boolean;
}

interface FormContentProps {
  sectionTitle: string;
  onChange?: (data: { sectionTitle: string; items: ContentItem[] }) => void;
}

const FormContent: React.FC<FormContentProps> = ({ sectionTitle, onChange }) => {
  const [items, setItems] = useState<ContentItem[]>([]);

  // 🟢 Thêm mới nội dung
  const handleAdd = () => {
    const newItem: ContentItem = {
      id: Date.now(),
      order: items.length + 1,
      content: "",
      isEditing: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // ✏️ Sửa / Lưu
  const handleToggleEdit = (id: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isEditing: !i.isEditing } : i))
    );
  };

  // 🧾 Cập nhật nội dung
  const handleChange = (id: number, value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, content: value } : i))
    );
  };

  // ❌ Xóa
  const handleDelete = (id: number) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      // 🔁 Cập nhật lại thứ tự sau khi xóa
      return filtered.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  // 🔄 Mỗi khi items thay đổi → gửi JSON ngược lên
  useEffect(() => {
    if (onChange) {
      const sorted = [...items].sort((a, b) => a.order - b.order);
      onChange({ sectionTitle, items: sorted });
    }
  }, [items, sectionTitle, onChange]);

  return (
    <Box sx={{ mt: 2 }}>
      {items.map((item) => (
        <Box
          key={item.id}
          sx={{
            mt: 1,
            p: 2,
            borderRadius: 2,
            backgroundColor: "grey.50",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {item.isEditing ? (
            <Grid container spacing={2} alignItems="center">
              {/* Ô nhập nội dung */}
              <Grid size={{ xs: 6 }}>
  <TextField
    fullWidth
    multiline
    minRows={1}
    value={`${item.order}. ${item.content}`}
    onChange={(e) => {
      const inputValue = e.target.value;
      const prefix = `${item.order}. `;

      // Chặn nếu user cố xóa prefix
      if (!inputValue.startsWith(prefix)) return;

      // Chỉ lấy phần nội dung sau prefix
      const newContent = inputValue.slice(prefix.length);
      handleChange(item.id, newContent);
    }}
    onSelect={(e) => {
      const input = e.target as HTMLInputElement;
      const prefixLength = `${item.order}. `.length;

      // Nếu con trỏ nằm trong prefix → nhảy sang sau prefix
      if (input.selectionStart! < prefixLength) {
        input.setSelectionRange(prefixLength, prefixLength);
      }
    }}
    onClick={(e) => {
      const input = e.target as HTMLInputElement;
      const prefixLength = `${item.order}. `.length;

      // Nếu click vào vùng prefix → đẩy con trỏ ra sau prefix
      if (input.selectionStart! < prefixLength) {
        input.setSelectionRange(prefixLength, prefixLength);
      }
    }}
    onKeyDown={(e) => {
      const input = e.target as HTMLInputElement;
      const prefixLength = `${item.order}. `.length;

      // Ngăn backspace/xóa di chuyển vào prefix
      if (
        (e.key === "ArrowLeft" && input.selectionStart! <= prefixLength) ||
        (e.key === "Backspace" && input.selectionStart! <= prefixLength)
      ) {
        e.preventDefault();
        input.setSelectionRange(prefixLength, prefixLength);
      }
    }}
    sx={{
      "& .MuiInputBase-root": {
        backgroundColor: "white",
        borderRadius: 1,
      },
      "& .MuiInputBase-input": {
        color: "black",
      },
    }}
  />
</Grid>


              <Grid size={{ xs: 4 }} />

              {/* Nút lưu / xóa */}
              <Grid size={{ xs: 2 }} sx={{ textAlign: "center" }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{
                    minWidth: 75,
                    textTransform: "none",
                    fontWeight: 600,
                    mr: 1,
                  }}
                  onClick={() => handleToggleEdit(item.id)}
                >
                  💾 Lưu
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{
                    minWidth: 75,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                  onClick={() => handleDelete(item.id)}
                >
                  🗑 Xóa
                </Button>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 6 }}>
                <Box
                  sx={{
                    p: 1.5,
                    backgroundColor: "white",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    minHeight: 60,
                  }}
                >
                  <Typography
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: 15,
                    }}
                  >
                    <strong>{item.order}.</strong> {item.content}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 4 }} />

              <Grid size={{ xs: 2 }} sx={{ textAlign: "center" }}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{
                    minWidth: 75,
                    textTransform: "none",
                    fontWeight: 600,
                    mr: 1,
                  }}
                  onClick={() => handleToggleEdit(item.id)}
                >
                  ✏️ Sửa
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{
                    minWidth: 75,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                  onClick={() => handleDelete(item.id)}
                >
                  🗑 Xóa
                </Button>
              </Grid>
            </Grid>
          )}
        </Box>
      ))}

      {/* Nút thêm nội dung */}
      <Box textAlign="left" sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          color="success"
          onClick={handleAdd}
          sx={{
            borderRadius: 5,
            textTransform: "none",
            px: 2,
            py: 0.8,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          ➕ Thêm nội dung
        </Button>
      </Box>
    </Box>
  );
};

export default FormContent;
