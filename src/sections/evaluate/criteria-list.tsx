import React, { useEffect, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";

import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

import { Editor } from "src/utils/custom-editor";

export interface ListCriterion {
  id: number;
  content: string;
  score: string;
  evidence: boolean;
  isEditing: boolean;
  subList: { id: number; content: string; score: string; isEditing: boolean }[];
}

interface CriteriaListProps {
  onChange?: (criteria: ListCriterion[]) => void;
  data?: ListCriterion[];
  externalAdd?: boolean;
}

const CriteriaList: React.FC<CriteriaListProps> = ({
  onChange,
  data = [],
  externalAdd = false,
}) => {
  const [criteria, setCriteria] = useState<ListCriterion[]>(data);

  useEffect(() => {
    setCriteria(data);
  }, [data]);

  const pushChange = (updated: ListCriterion[]) => {
    setCriteria(updated);
    onChange?.(updated);
  };

  const handleAdd = () => {
    const newItem: ListCriterion = {
      id: Date.now(),
      content: "",
      score: "",
      evidence: false,
      isEditing: true,
      subList: [
        { id: Date.now() + 1, content: "Đánh giá mới", score: "", isEditing: true },
      ],
    };
    pushChange([...criteria, newItem]);
  };

  const handleChange = (id: number, updates: Partial<ListCriterion>) => {
    const updated = criteria.map((c) => (c.id === id ? { ...c, ...updates } : c));
    pushChange(updated);
  };

  const handleDelete = (id: number) => {
    pushChange(criteria.filter((c) => c.id !== id));
  };

  const handleAddSub = (parentId: number) => {
    const updated = criteria.map((c) =>
      c.id === parentId
        ? {
            ...c,
            subList: [
              ...c.subList,
              { id: Date.now(), content: "Đánh giá mới", score: "", isEditing: true },
            ],
          }
        : c
    );
    pushChange(updated);
  };

  const handleChangeSub = (
    parentId: number,
    subId: number,
    updates: Partial<ListCriterion["subList"][number]>
  ) => {
    const updated = criteria.map((c) =>
      c.id === parentId
        ? {
            ...c,
            subList: c.subList.map((s) => (s.id === subId ? { ...s, ...updates } : s)),
          }
        : c
    );
    pushChange(updated);
  };

  const handleDeleteSub = (parentId: number, subId: number) => {
    const updated = criteria.map((c) =>
      c.id === parentId ? { ...c, subList: c.subList.filter((s) => s.id !== subId) } : c
    );
    pushChange(updated);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {criteria.map((item) => (
        <Box
          key={item.id}
          sx={{
            mt: 1,
            p: 1.5,
            borderColor: "lightgrey",
            borderRadius: 2,
            backgroundColor: "grey.50",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
          }}
        >
          {/* ===== TIÊU CHÍ CHA ===== */}
          {item.isEditing ? (
            <Grid container spacing={2} alignItems="center">
              {/* (1) Nội dung 4 */}
              <Grid size={{ xs: 4 }}>
                <Box
                  sx={{
                    backgroundColor: "white",
                    borderRadius: 1,
                    "& .ck-editor__editable": { minHeight: "100px", padding: "8px 10px" },
                  }}
                >
                  <CKEditor
                    editor={Editor.ClassicEditor}
                    config={{ plugins: Editor.plugins, toolbar: Editor.toolbar, licenseKey: "GPL", placeholder: "Tiêu chí có danh sách..." }}
                    data={item.content}
                    onChange={(_, editor) => handleChange(item.id, { content: editor.getData() })}
                  />
                </Box>
              </Grid>

              {/* (2) Điểm 1 */}
              <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Điểm"
                  type="number"
                  value={item.score}
                  onChange={(e) => handleChange(item.id, { score: e.target.value })}
                />
              </Grid>

              {/* (3) Spacer 2 + 2 */}
              <Grid size={{ xs: 2 }} />
              <Grid size={{ xs: 2 }} />

              {/* (4) Minh chứng 1 */}
              <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={item.evidence}
                      onChange={(e) => handleChange(item.id, { evidence: e.target.checked })}
                      size="small"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              </Grid>

              {/* (5) Hành động 2: 2 hàng như criteria-section */}
              <Grid container size={{ xs: 2 }} sx={{ gap: 1 }}>
                {/* Hàng 1: Lưu/Xóa (6/6) */}
                <Grid container size={{ xs: 12 }}>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ width: "90%", fontSize: 12, textTransform: "none", fontWeight: 600 }}
                      onClick={() => handleChange(item.id, { isEditing: false })}
                    >
                      Lưu
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: "left" }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{ width: "90%", fontSize: 12, textTransform: "none", fontWeight: 600 }}
                      onClick={() => handleDelete(item.id)}
                    >
                      Xóa
                    </Button>
                  </Grid>
                </Grid>

                {/* Hàng 2: ➕ Đánh giá (12) */}
                <Grid size={{ xs: 12 }} sx={{ textAlign: "center" }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    sx={{ width: "95%", fontSize: 12, borderRadius: 5, textTransform: "none", fontWeight: 600 }}
                    onClick={() => handleAddSub(item.id)}
                  >
                    ➕ Đánh giá
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} alignItems="center">
              {/* (1) Nội dung 4 */}
              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="body1"
                  sx={{ fontSize: 15, fontWeight: 500, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  dangerouslySetInnerHTML={{ __html: item.content || "<i>Chưa có nội dung tiêu chí</i>" }}
                />
              </Grid>

              {/* (2) Điểm 1 */}
              <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{item.score}</Typography>
              </Grid>

              {/* (3) Spacer 2 + 2 */}
              <Grid size={{ xs: 2 }} />
              <Grid size={{ xs: 2 }} />

              {/* (4) Minh chứng 1 */}
              <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
                {item.evidence ? (
                  <Typography variant="body2" color="success.main">✔</Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled">—</Typography>
                )}
              </Grid>

              {/* (5) Hành động 2: 2 hàng như criteria-section */}
              <Grid container size={{ xs: 2 }} sx={{ gap: 1 }}>
                {/* Hàng 1: Sửa/Xóa (6/6) */}
                <Grid container size={{ xs: 12 }}>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      sx={{ width: "90%", fontSize: 12, textTransform: "none", fontWeight: 600 }}
                      onClick={() => handleChange(item.id, { isEditing: true })}
                    >
                      Sửa
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: "left" }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{ width: "90%", fontSize: 12, textTransform: "none", fontWeight: 600 }}
                      onClick={() => handleDelete(item.id)}
                    >
                      Xóa
                    </Button>
                  </Grid>
                </Grid>

                {/* Hàng 2: ➕ Đánh giá (12) */}
                <Grid size={{ xs: 12 }} sx={{ textAlign: "center" }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    sx={{ width: "95%", fontSize: 12, borderRadius: 6, textTransform: "none", fontWeight: 600 }}
                    onClick={() => handleAddSub(item.id)}
                  >
                    ➕ Đánh giá
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* ===== DANH SÁCH CON ===== */}
          {item.subList.length > 0 && (
            <Box mt={1}>
              {item.subList.map((sub) => (
                <Grid container key={sub.id} spacing={2} alignItems="center" sx={{ mt: 2.5 }}>
                  {/* (1) Nội dung con 4 */}
                  <Grid size={{ xs: 4 }}>
                    {sub.isEditing ? (
                      <Box
                        sx={{
                          backgroundColor: "white",
                          borderRadius: 1,
                          "& .ck-editor__editable": { minHeight: "80px", padding: "8px 10px" },
                        }}
                      >
                        <CKEditor
                          editor={Editor.ClassicEditor}
                          config={{ plugins: Editor.plugins, toolbar: Editor.toolbar, licenseKey: "GPL", placeholder: "Đánh giá..." }}
                          data={sub.content}
                          onChange={(_, editor) =>
                            handleChangeSub(item.id, sub.id, { content: editor.getData() })
                          }
                        />
                      </Box>
                    ) : (
                      <Typography
                        variant="body1"
                        sx={{ fontSize: 15, fontWeight: 500, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                        dangerouslySetInnerHTML={{ __html: sub.content || "<i>Chưa có nội dung đánh giá</i>" }}
                      />
                    )}
                  </Grid>

                  {/* (2) Điểm con 1 */}
                  <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
                    {sub.isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="Điểm"
                        value={sub.score}
                        onChange={(e) => handleChangeSub(item.id, sub.id, { score: e.target.value })}
                      />
                    ) : (
                      <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{sub.score}</Typography>
                    )}
                  </Grid>

                  {/* (3) Spacer 5 */}
                  <Grid size={{ xs: 5 }} />

                  {/* (4) Hành động con 2: 2 nút xếp 6/6 theo hàng 1 */}
                  <Grid container size={{ xs: 2 }}>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: "right" }}>
                      {sub.isEditing ? (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          sx={{ width: "90%", fontSize: 12, textTransform: "none", fontWeight: 600 }}
                          onClick={() => handleChangeSub(item.id, sub.id, { isEditing: false })}
                        >
                          Lưu
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          sx={{ width: "90%", fontSize: 12, textTransform: "none", fontWeight: 600 }}
                          onClick={() => handleChangeSub(item.id, sub.id, { isEditing: true })}
                        >
                          Sửa
                        </Button>
                      )}
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: "left" }}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{ width: "90%", fontSize: 12, textTransform: "none", fontWeight: 600 }}
                        onClick={() => handleDeleteSub(item.id, sub.id)}
                      >
                        Xóa
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              ))}
            </Box>
          )}
        </Box>
      ))}

      {/* Nút thêm tiêu chí (ẩn nếu dùng dropdown cha) */}
      {!externalAdd && (
        <Box textAlign="left" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            color="success"
            onClick={handleAdd}
            sx={{ borderRadius: 5, textTransform: "none", px: 2, py: 0.8, fontWeight: 600, fontSize: 13 }}
          >
            📋 Thêm tiêu chí có danh sách
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CriteriaList;
