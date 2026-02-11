import React, { useState } from "react";

import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";

import CriteriaList, { ListCriterion } from "./criteria-list";
import CriteriaBonus, { BonusCriterion } from "./criteria-bonus";
import CriteriaRegular, { RegularCriterion } from "./criteria-regular";

interface CriteriaGroup {
  id: number;
  title: string;
  totalScore: number;
  isEditing: boolean;
  regularCriteria: RegularCriterion[];
  listCriteria: ListCriterion[];
  bonusCriteria?: BonusCriterion[];
  type: "regular" | "bonus";
}

export interface CriteriaProps {
  sectionTitle: string;
  onChange?: (groups: CriteriaGroup[]) => void; 
}

// const Criteria: React.FC<CriteriaProps> = ({ sectionTitle, onChange }) => {
//   const [groups, setGroups] = useState<CriteriaGroup[]>([]);
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const [activeGroupId, setActiveGroupId] = useState<number | null>(null);

//   // 💾 Lưu nhóm
//   const handleSaveGroup = (id: number, title: string) => {
//     setGroups((prev) =>
//       prev.map((g) => (g.id === id ? { ...g, title, isEditing: false } : g))
//     );
//   };

//   // ✏️ Sửa nhóm
//   const updateGroups = (updater: (prev: CriteriaGroup[]) => CriteriaGroup[]) => {
//     setGroups(prev => {
//       const next = updater(prev);
//       onChange?.(next);         // báo cha mỗi lần đổi
//       return next;
//     });
//   };

//   // 🗑 Xóa nhóm
//   const handleDeleteGroup = (id: number) => {
//     setGroups((prev) => prev.filter((g) => g.id !== id));
//   };

//   // 🧩 Cập nhật dữ liệu tiêu chí thường
//   const handleRegularChange = (groupId: number, data: RegularCriterion[]) => {
//     const total = data.reduce(
//       (sum, item) => sum + (parseFloat(item.score || "0") || 0),
//       0
//     );

//     setGroups((prev) =>
//       prev.map((g) =>
//         g.id === groupId
//           ? { ...g, regularCriteria: data, totalScore: total }
//           : g
//       )
//     );
//   };


//   // 📋 Cập nhật dữ liệu tiêu chí có danh sách
// const handleListChange = (groupId: number, data: ListCriterion[]) => {
//   // 🔹 Chỉ tính tổng điểm của các câu chính
//   const total = data.reduce(
//     (sum, item) => sum + (parseFloat(item.score || "0") || 0),
//     0
//   );

//   setGroups((prev) =>
//     prev.map((g) =>
//       g.id === groupId
//         ? { ...g, listCriteria: data, totalScore: total }
//         : g
//     )
//   );
// };


//   // ⭐ Cập nhật dữ liệu tiêu chí điểm thưởng
//   const handleBonusChange = (groupId: number, data: BonusCriterion[]) => {
//     setGroups((prev) =>
//       prev.map((g) => (g.id === groupId ? { ...g, bonusCriteria: data } : g))
//     );
//   };

//   // 📥 Mở menu dropdown thêm tiêu chí
//   const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, groupId: number) => {
//     setAnchorEl(event.currentTarget);
//     setActiveGroupId(groupId);
//   };

//   // 📤 Đóng menu
//   const handleCloseMenu = () => {
//     setAnchorEl(null);
//     setActiveGroupId(null);
//   };

//   // ➕ Tạo nhóm mới
//   const handleAddGroup = (type: "regular" | "bonus") => {
//     const newGroup: CriteriaGroup = {
//       id: Date.now(),
//       title: "",
//       totalScore: 0,
//       isEditing: true,
//       regularCriteria: [],
//       listCriteria: [],
//       bonusCriteria: [],
//       type,
//     };
//     setGroups((prev) => [...prev, newGroup]);
//   };

const Criteria: React.FC<CriteriaProps> = ({ sectionTitle, onChange }) => {
  const [groups, setGroups] = useState<CriteriaGroup[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  React.useEffect(() => {
  onChange?.(groups);
}, [groups]);
const handleUpdateCriteria = (groupId: number, updatedCriteria: RegularCriterion[]) => {
  setGroups((prev) =>
    prev.map((g) => (g.id === groupId ? { ...g, criteria: updatedCriteria } : g))
  );
};
// 📥 Mở menu dropdown thêm tiêu chí
const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, groupId: number) => {
  setAnchorEl(event.currentTarget);
  setActiveGroupId(groupId);
};

// 📤 Đóng menu
const handleCloseMenu = () => {
  setAnchorEl(null);
  setActiveGroupId(null);
  };
  
  // helper: set + notify
  const updateGroups = (updater: (prev: CriteriaGroup[]) => CriteriaGroup[]) => {
    setGroups(prev => {
      const next = updater(prev);
      onChange?.(next);         // báo cha mỗi lần đổi
      return next;
    });
  };

  const handleSaveGroup = (id: number, title: string) =>
    updateGroups(prev => prev.map(g => g.id === id ? { ...g, title, isEditing: false } : g));

  const handleEditGroup = (id: number) =>
    updateGroups(prev => prev.map(g => g.id === id ? { ...g, isEditing: true } : { ...g, isEditing: false }));

  const handleDeleteGroup = (id: number) =>
    updateGroups(prev => prev.filter(g => g.id !== id));

  const handleRegularChange = (groupId: number, data: RegularCriterion[]) =>
  updateGroups(prev => {
    const total = data.reduce(
      (sum, item) => sum + (parseFloat(item.score || "0") || 0),
      0
    );
    return prev.map(g =>
      g.id === groupId ? { ...g, regularCriteria: data, totalScore: total } : g
    );
  });

 const handleListChange = (groupId: number, data: ListCriterion[]) =>
  updateGroups(prev => {
    const total = data.reduce(
      (sum, item) => sum + (parseFloat(item.score || "0") || 0),
      0
    );
    return prev.map(g =>
      g.id === groupId ? { ...g, listCriteria: data, totalScore: total } : g
    );
  });


  const handleBonusChange = (groupId: number, data: BonusCriterion[]) =>
    updateGroups(prev => prev.map(g => g.id === groupId ? { ...g, bonusCriteria: data } : g));
type GroupType = "regular" | "bonus";
  const handleAddGroup = (type: GroupType) =>
    updateGroups(prev => [...prev, {
      id: Date.now(),
      title: "",
      totalScore: 0,
      isEditing: true,
      regularCriteria: [],
      listCriteria: [],
      bonusCriteria: [],
      type
    }]);

  return (
    <Paper
      elevation={0}
      sx={{ mt: 2, borderRadius: 3, backgroundColor: "background.paper" }}
    >
      {/* Header bảng */}
      <Grid
        container
        sx={{
          backgroundColor: "grey.100",
          borderRadius: 1,
          p: 1.5,
          fontWeight: 600,
          color: "text.secondary",
        }}
      >
        <Grid size={{ xs: 4 }}>
          <Typography variant="body2">NỘI DUNG ĐÁNH GIÁ</Typography>
        </Grid>
        <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
          <Typography variant="body2">ĐIỂM</Typography>
        </Grid>
        <Grid size={{ xs: 2 }} sx={{ textAlign: "center" }}>
          <Typography variant="body2">TỰ ĐÁNH GIÁ</Typography>
        </Grid>
        <Grid size={{ xs: 2 }} sx={{ textAlign: "center" }}>
          <Typography variant="body2">HIỆU TRƯỞNG</Typography>
        </Grid>
        <Grid size={{ xs: 1 }} sx={{ textAlign: "center" }}>
          <Typography variant="body2">MINH CHỨNG</Typography>
        </Grid>
        <Grid size={{ xs: 2 }} />
      </Grid>

      <Divider sx={{ my: 1 }} />

      {/* Danh sách nhóm tiêu chí */}
      {groups.map((group) => (
        <Paper
          key={group.id}
          elevation={1}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            backgroundColor: "background.default",
            border: "1px solid",
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* (1) Tên nhóm tiêu chí + điểm thưởng */}
            <Grid size={{ xs: 6 }}>
              {group.isEditing ? (
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Nhập tên nhóm tiêu chí..."
                    value={group.title || ""}
                    onChange={(e) =>
                      setGroups((prev) =>
                        prev.map((g) =>
                          g.id === group.id ? { ...g, title: e.target.value } : g
                        )
                      )
                    }
                    sx={{
                      "& .MuiInputBase-root": {
                        backgroundColor: "white",
                        borderRadius: 1,
                        boxShadow: "inset 0 0 5px rgba(0,0,0,0.1)",
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: "black",
                      },
                    }}
                  />

                  {group.type === "bonus" && (
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Điểm thưởng"
                      value={group.totalScore === 0 ? "" : group.totalScore}
                      onChange={(e) =>
                        setGroups((prev) =>
                          prev.map((g) =>
                            g.id === group.id
                              ? { ...g, totalScore: parseFloat(e.target.value) || 0 }
                              : g
                          )
                        )
                      }
                      sx={{
                        width: 150,
                        "& .MuiInputBase-root": {
                          backgroundColor: "white",
                          borderRadius: 1,
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "black",
                        },
                      }}
                    />
                  )}

                </Box>
              ) : (
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2" fontWeight={600} fontSize={17}>
                    {group.title || "(Chưa đặt tên)"}{" "}
                    <Box component="span" color="text.secondary" ml={1}>
                      (Tổng điểm: {group.totalScore})
                    </Box>
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* (2) Hành động nhóm */}
            <Grid size={{ xs: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                {group.isEditing ? (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{ minWidth: 90, textTransform: "none", py: 0.5 }}
                    onClick={() => handleSaveGroup(group.id, group.title)}
                  >
                    💾 Lưu
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{ minWidth: 90, textTransform: "none", py: 0.5 }}
                    onClick={() => handleEditGroup(group.id)}
                  >
                    ✏️ Sửa
                  </Button>
                )}

                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{ minWidth: 90, textTransform: "none", py: 0.5 }}
                  disabled={group.isEditing}
                  onClick={() => handleDeleteGroup(group.id)}
                >
                  🗑 Xóa
                </Button>
              </Box>
            </Grid>

            {/* (3) Component con */}
            <Grid size={{ xs: 12 }}>
              {group.type === "bonus" ? (
                <CriteriaBonus
                  externalAdd
                  data={group.bonusCriteria || []}
                  onChange={(data) => handleBonusChange(group.id, data)}
                />
              ) : (
                <>
                  <CriteriaRegular
                    externalAdd
                    data={group.regularCriteria}
                    onChange={(data) => handleRegularChange(group.id, data)}
                  />

                  <CriteriaList
                    externalAdd
                    data={group.listCriteria}
                    onChange={(data) => handleListChange(group.id, data)}
                  />
                </>
              )}
            </Grid>

            {/* ➕ Dropdown thêm tiêu chí (chỉ nhóm thường có) */}
            {group.type === "regular" && (
              <Grid size={{ xs: 12 }} sx={{ textAlign: "left", mt: 1 }}>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={(e) => handleOpenMenu(e, group.id)}
                  sx={{
                    borderRadius: 5,
                    textTransform: "none",
                    px: 2,
                    py: 0.8,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  ➕ Thêm tiêu chí
                </Button>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl) && activeGroupId === group.id}
                  onClose={handleCloseMenu}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                >
                  <MenuItem
                    onClick={() => {
                      handleRegularChange(group.id, [
                        ...group.regularCriteria,
                        {
                          id: Date.now(),
                          content: "",
                          score: "",
                          evidence: false,
                          isEditing: true,
                        },
                      ]);
                      handleCloseMenu();
                    }}
                  >
                    ➕ Thêm tiêu chí
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleListChange(group.id, [
                        ...group.listCriteria,
                        {
                          id: Date.now(),
                          content: "",
                          score: "",
                          subList: [],
                          evidence: false,
                          isEditing: true,
                        },
                      ]);
                      handleCloseMenu();
                    }}
                  >
                    📋 Thêm tiêu chí có danh sách
                  </MenuItem>
                </Menu>
              </Grid>
            )}
          </Grid>
        </Paper>
      ))}

      {/* Nút tạo nhóm tiêu chí */}
      <Box textAlign="center" sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={(e) => {
            setActiveGroupId(null);
            setAnchorEl(e.currentTarget);
          }}
          sx={{
            borderRadius: 5,
            textTransform: "none",
            px: 3,
            py: 1,
            fontWeight: 600,
          }}
        >
          ➕ Tạo nhóm tiêu chí
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && activeGroupId === null}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <MenuItem
            onClick={() => {
              handleAddGroup("regular");
              handleCloseMenu();
            }}
          >
            🧩 Tạo nhóm tiêu chí thường
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleAddGroup("bonus");
              handleCloseMenu();
            }}
          >
            ⭐ Tạo nhóm tiêu chí điểm thưởng
          </MenuItem>
        </Menu>
      </Box>
    </Paper>
  );
};

export default Criteria;
