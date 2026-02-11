import React, { useState } from 'react';

import {
  Box,
  Typography,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import {
  UploadedFileInfo,
  EvaluationSection,
  EvaluationItem,
  getScoreLabels,
} from 'src/services/type';

import { HTMLContent } from '../form-evaluate-body-12';
import { MobileScoreDisplay } from './MobileScoreDisplay';
import { JustificationField } from './JustificationField ';
import { SingleChoiceSelector } from '../form-evaluate-body-12';
import { MobileEvidenceUploadCompact } from './MobileEvidenceUploadCompact';

export const MobileRegularItem = ({
  item,
  sectionIndex,
  itemIndex,
  onJustificationChange,
  onJustificationBlur,
  onScoreChange,
  onEvidenceChange,
  onEvidenceRemove,
  onEvidenceUpload,
  readOnly = false,
  userPermissions
}: {
  item: EvaluationItem;
  sectionIndex: number;
  itemIndex: number;
  onJustificationChange: (sectionIndex: number, itemIndex: number, justification: string) => void;
  onJustificationBlur: (sectionIndex: number, itemIndex: number, justification: string) => void;
  onScoreChange: (sectionIndex: number, itemIndex: number, type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onEvidenceChange: (sectionIndex: number, itemIndex: number, files: UploadedFileInfo[]) => void;
  onEvidenceRemove: (sectionIndex: number, itemIndex: number, fileIndex: number) => void;
  onEvidenceUpload: (sectionIndex: number, itemId: string, files: File[]) => Promise<UploadedFileInfo[]>;
  readOnly?: boolean;
  userPermissions: any;
}) => {
  const theme = useTheme();
  
  return (
    <Box sx={{
      border: `1px solid ${theme.palette.grey[300]}`,
      borderRadius: 1,
      padding: 2,
      marginBottom: 2,
      backgroundColor: 'white',
    }}>
      {/* Item header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Chip
            label={item.id}
            size="small"
            color="primary"
            variant="filled"
            sx={{ minWidth: 36 }}
          />
          <Typography variant="subtitle2" fontWeight="bold">
            {item.title}
          </Typography>
        </Box>
        
        <HTMLContent content={item.content} />
        
        {/* Single-choice selector */}
        {item.hasType === 'single-choice' && item.subItems && (
          <Box sx={{ mt: 2 }}>
            <SingleChoiceSelector
              options={item.subItems}
              currentScore={item.selfScore}
              onSelect={(value) => {
                const scoreValue = parseFloat(value);
                onScoreChange(sectionIndex, itemIndex, 'selfScore', scoreValue);
              }}
              readOnly={readOnly}
              userPermissions={userPermissions}
            />
          </Box>
        )}
      </Box>
      
      {/* Scores */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 1, 
        mb: 2 
      }}>
        <Box>
          <MobileScoreDisplay
            label="Điểm tối đa"
            value={parseFloat(item.points)}
            maxValue={parseFloat(item.points)}
            color="primary"
            disabled
          />
        </Box>
        <Box>
          <MobileScoreDisplay
            label="Tự đánh giá"
            value={item.selfScore || 0}
            maxValue={parseFloat(item.points)}
            onChange={item.hasType !== 'single-choice' ? 
              (value) => onScoreChange(sectionIndex, itemIndex, 'selfScore', value) : undefined}
            disabled={readOnly || !userPermissions.canEditSelfScore || item.hasType === 'single-choice'}
            color="primary"
          />
        </Box>
        <Box>
          <MobileScoreDisplay
            label="Thẩm định"
            value={item.thamDinhScore || 0}
            maxValue={parseFloat(item.points)}
            onChange={(value) => onScoreChange(sectionIndex, itemIndex, 'thamDinhScore', value)}
            disabled={readOnly || !userPermissions.canEditPrincipalScore}
            color="secondary"
          />
        </Box>
        <Box>
          <MobileScoreDisplay
            label="Hiệu trưởng"
            value={item.hieuTruongScore || 0}
            maxValue={parseFloat(item.points)}
            onChange={(value) => onScoreChange(sectionIndex, itemIndex, 'hieuTruongScore', value)}
            disabled={readOnly || !userPermissions.canEditHieuTruongScore}
            color="warning"
          />
        </Box>
      </Box>
      
      {/* Justification */}
      {item.justification !== undefined && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ mb: 0.5 }}>
            Thuyết minh:
          </Typography>
          <JustificationField
            value={item.justification || ''}
            onBlur={(value) => onJustificationBlur(sectionIndex, itemIndex, value)}
            placeholder="Nhập thuyết minh..."
            rows={2}
            disabled={readOnly || !userPermissions.canEditJustification}
            size="small"
          />
        </Box>
      )}
      
      {/* Evidence */}
      {(item.hasEvidence || item.evidenceFiles) && (
        <MobileEvidenceUploadCompact
          files={item.evidenceFiles || []}
          onFilesChange={(files) => onEvidenceChange(sectionIndex, itemIndex, files)}
          onFileRemove={(fileIndex) => onEvidenceRemove(sectionIndex, itemIndex, fileIndex)}
          onUpload={(files) => onEvidenceUpload(sectionIndex, item.id, files)}
          sectionIndex={sectionIndex}
          itemId={item.id}
          readOnly={readOnly}
          userPermissions={userPermissions}
        />
      )}
    </Box>
  );
};