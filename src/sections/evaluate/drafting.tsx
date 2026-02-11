import React, { useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';

import { Box, Button, Typography, Paper } from '@mui/material';

import { Editor } from 'src/utils/custom-editor';

interface DraftingProps {
  sectionTitle: string;
  onChange?: (content: string) => void;
}
const Drafting: React.FC<DraftingProps> = ({ sectionTitle, onChange }) => {
  const [content, setContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(true);

  return (
    <Paper
      sx={{
        p: 3,
        mt: 2,
        borderRadius: 3,
        backgroundColor: 'grey.50',
      }}
    >
      {/* Khi đang chỉnh sửa */}
      {isEditing ? (
        <>
          <CKEditor
            editor={Editor.ClassicEditor}
            config={{
              plugins: Editor.plugins,
              toolbar: Editor.toolbar,
              licenseKey: 'GPL',
            }}
            data={content}
            onChange={(_, editor) => setContent(editor.getData())}
          />

          <Box textAlign="right" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setIsEditing(false);
                onChange?.(content);
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              💾 Lưu
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              minHeight: 120,
              backgroundColor: 'white',
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          <Box textAlign="right" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setIsEditing(true)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              ✏️ Sửa
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default Drafting;
