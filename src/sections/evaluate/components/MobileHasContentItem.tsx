import React, { useState } from 'react';

import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  IconButton,
  Chip,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

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


export const MobileHasContentItem = ({
  item,
  sectionIndex,
  itemIndex,
  onScoreChange,
  onOptionSelect,
  onJustificationChange,
  onJustificationBlur,
  onEvidenceChange,
  onEvidenceRemove,
  onEvidenceUpload,
  readOnly = false,
  userPermissions
}: {
  item: EvaluationItem;
  sectionIndex: number;
  itemIndex: number;
  onScoreChange: (sectionIndex: number, itemIndex: number, subIndex: number, type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onOptionSelect: (sectionIndex: number, itemIndex: number, subIndex: number, value: string) => void;
  onJustificationChange?: (sectionIndex: number, itemIndex: number, justification: string, subIndex?: number, isSubItem?: boolean) => Promise<any>;
  onJustificationBlur: (sectionIndex: number, itemIndex: number, justification: string, subIndex?: number, isSubItem?: boolean) => void;
  onEvidenceChange: (sectionIndex: number, itemIndex: number, subIndex: number, activityIndex: number, files: UploadedFileInfo[], isSubItem?: boolean) => void;
  onEvidenceRemove: (sectionIndex: number, itemIndex: number, fileIndex: number, subIndex?: number, activityIndex?:number, isSubItem?: boolean) => void;
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
      {/* Main item content */}
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
      </Box>
      
      {/* Scores for main item */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
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
            color="primary"
            disabled
            />
        </Box>
        <Box>
            <MobileScoreDisplay
            label="Thẩm định"
            value={item.thamDinhScore || 0}
            maxValue={parseFloat(item.points)}
            onChange={(value) => onScoreChange(sectionIndex, itemIndex, -1, 'thamDinhScore', value)}
            disabled={readOnly || !userPermissions.canEditPrincipalScore}
            color="secondary"
            />
        </Box>
        </Box>
      
      {/* Justification for main item */}
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
      
      {/* Evidence for main item */}
      {(item.hasEvidence || item.evidenceFiles) && (
        <MobileEvidenceUploadCompact
          files={item.evidenceFiles || []}
          onFilesChange={(files) => onEvidenceChange(sectionIndex, itemIndex, -1, -1, files, false)}
          onFileRemove={(fileIndex) => onEvidenceRemove(sectionIndex, itemIndex, fileIndex, -1, -1, false)}
          onUpload={(files) => onEvidenceUpload(sectionIndex, item.id, files)}
          sectionIndex={sectionIndex}
          itemId={item.id}
          readOnly={readOnly}
          userPermissions={userPermissions}
        />
      )}
      
      {/* Sub-items */}
      {item.hasContent?.map((subItem, subIndex) => (
        <Box key={subIndex} sx={{
          mt: 2,
          pt: 2,
          borderTop: `1px dashed ${theme.palette.grey[300]}`,
        }}>
          <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ mb: 1 }}>
            {String.fromCharCode(97 + subIndex)}. {subItem.content}
          </Typography>
          
          {/* Single-choice selector for sub-items */}
          {subItem.hasType === 'single-choice' && subItem.subItems && (
            <Box sx={{ mb: 2 }}>
              <SingleChoiceSelector
                options={subItem.subItems}
                currentScore={subItem.selfScore}
                onSelect={(value) => onOptionSelect(sectionIndex, itemIndex, subIndex, value)}
                level={0}
                readOnly={readOnly}
                userPermissions={userPermissions}
              />
            </Box>
          )}
          
          {/* Scores for sub-item */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 1, 
            mb: 2 
            }}>
            <Box>
                <MobileScoreDisplay
                label="Điểm tối đa"
                value={parseFloat(subItem.points)}
                maxValue={parseFloat(subItem.points)}
                color="primary"
                disabled
                />
            </Box>
            <Box>
                <MobileScoreDisplay
                label="Tự đánh giá"
                value={subItem.selfScore || 0}
                maxValue={parseFloat(subItem.points)}
                color="primary"
                disabled
                />
            </Box>
            <Box>
                <MobileScoreDisplay
                label="Thẩm định"
                value={subItem.thamDinhScore || 0}
                maxValue={parseFloat(subItem.points)}
                onChange={(value) => onScoreChange(sectionIndex, itemIndex, subIndex, 'thamDinhScore', value)}
                disabled={readOnly || !userPermissions.canEditPrincipalScore}
                color="secondary"
                />
            </Box>
            </Box>

          
          {/* Justification for sub-item */}
          {subItem.justification !== undefined && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ mb: 0.5 }}>
                Thuyết minh:
              </Typography>
              <JustificationField
                value={subItem.justification || ''}
                onBlur={(value) => onJustificationBlur(sectionIndex, itemIndex, value, subIndex, true)}
                placeholder="Nhập thuyết minh..."
                rows={1}
                disabled={readOnly || !userPermissions.canEditJustification}
                size="small"
              />
            </Box>
          )}
          
          {/* Evidence for sub-item */}
          {(subItem.hasEvidence || subItem.evidenceFiles) && (
            <MobileEvidenceUploadCompact
              files={subItem.evidenceFiles || []}
              onFilesChange={(files) => onEvidenceChange(sectionIndex, itemIndex, subIndex, -1, files, true)}
              onFileRemove={(fileIndex) => onEvidenceRemove(sectionIndex, itemIndex, fileIndex, subIndex, -1, true)}
              onUpload={(files) => onEvidenceUpload(sectionIndex, `${item.id}_sub_${subIndex}`, files)}
              sectionIndex={sectionIndex}
              itemId={`${item.id}_sub_${subIndex}`}
              readOnly={readOnly}
              userPermissions={userPermissions}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};