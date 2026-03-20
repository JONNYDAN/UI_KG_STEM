import { useState, useEffect, useMemo } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';

import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import { Editor } from '../../../utils/custom-editor';
import * as entityService from '../../../services/entityService';

import type {
  RootCategory,
  Category,
  RootSubject,
  Subject,
  Relationship,
  Diagram,
} from '../../../services/entityService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

type TabKey =
  | 'rootCategories'
  | 'categories'
  | 'rootSubjects'
  | 'subjects'
  | 'relationships'
  | 'diagrams';

const TAB_KEY_BY_INDEX: Record<number, TabKey> = {
  0: 'rootCategories',
  1: 'categories',
  2: 'rootSubjects',
  3: 'subjects',
  4: 'relationships',
  5: 'diagrams',
};

const TAB_FILTER_CONFIG: Record<TabKey, { searchFields: string[]; filterOptions: Array<{ value: string; label: string }> }> = {
  rootCategories: {
    searchFields: ['id', 'code', 'name', 'description'],
    filterOptions: [
      { value: 'id', label: 'ID' },
      { value: 'code', label: 'Code' },
      { value: 'name', label: 'Name' },
      { value: 'description', label: 'Description' },
    ],
  },
  categories: {
    searchFields: ['id', 'code', 'name', 'root_category_id', 'level'],
    filterOptions: [
      { value: 'id', label: 'ID' },
      { value: 'code', label: 'Code' },
      { value: 'name', label: 'Name' },
      { value: 'root_category_id', label: 'Root Category ID' },
      { value: 'level', label: 'Level' },
    ],
  },
  rootSubjects: {
    searchFields: ['id', 'code', 'name', 'description', 'parent_id', 'level'],
    filterOptions: [
      { value: 'id', label: 'ID' },
      { value: 'code', label: 'Code' },
      { value: 'name', label: 'Name' },
      { value: 'parent_id', label: 'Parent ID' },
      { value: 'level', label: 'Level' },
    ],
  },
  subjects: {
    searchFields: ['id', 'code', 'name', 'root_subject_id', 'synonyms', 'categories', 'description'],
    filterOptions: [
      { value: 'id', label: 'ID' },
      { value: 'code', label: 'Code' },
      { value: 'name', label: 'Name' },
      { value: 'root_subject_id', label: 'Root Subject ID' },
      { value: 'synonyms', label: 'Synonyms' },
      { value: 'categories', label: 'Categories' },
    ],
  },
  relationships: {
    searchFields: ['id', 'code', 'name', 'description', 'semantic_type'],
    filterOptions: [
      { value: 'id', label: 'ID' },
      { value: 'code', label: 'Code' },
      { value: 'name', label: 'Name' },
      { value: 'semantic_type', label: 'Semantic Type' },
    ],
  },
  diagrams: {
    searchFields: ['id', 'root_category_id', 'category_name', 'category_id', 'trigger_code', 'image_path', 'description', 'path_pdf', 'processed'],
    filterOptions: [
      { value: 'id', label: 'ID' },
      { value: 'root_category_id', label: 'Root Category' },
      { value: 'category_name', label: 'Category Name' },
      { value: 'category_id', label: 'Category ID' },
      { value: 'trigger_code', label: 'Trigger Code' },
      { value: 'description', label: 'Description' },
      { value: 'path_pdf', label: 'PDF Link' },
      { value: 'processed', label: 'Processed' },
    ],
  },
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EntityManagementView() {
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State for each entity type
  const [rootCategories, setRootCategories] = useState<RootCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rootSubjects, setRootSubjects] = useState<RootSubject[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [uploadRootCategoryId, setUploadRootCategoryId] = useState<string>('');
  const [uploadCategoryId, setUploadCategoryId] = useState<number | ''>('');
  const [uploadDiagramId, setUploadDiagramId] = useState('');
  const [uploadProcessed, setUploadProcessed] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [searchByTab, setSearchByTab] = useState<Record<TabKey, string>>({
    rootCategories: '',
    categories: '',
    rootSubjects: '',
    subjects: '',
    relationships: '',
    diagrams: '',
  });
  const [filterFieldByTab, setFilterFieldByTab] = useState<Record<TabKey, string>>({
    rootCategories: 'name',
    categories: 'name',
    rootSubjects: 'name',
    subjects: 'name',
    relationships: 'name',
    diagrams: 'id',
  });
  const [filterValueByTab, setFilterValueByTab] = useState<Record<TabKey, string>>({
    rootCategories: '',
    categories: '',
    rootSubjects: '',
    subjects: '',
    relationships: '',
    diagrams: '',
  });
  const [pageByTab, setPageByTab] = useState<Record<TabKey, number>>({
    rootCategories: 0,
    categories: 0,
    rootSubjects: 0,
    subjects: 0,
    relationships: 0,
    diagrams: 0,
  });
  const [rowsPerPageByTab, setRowsPerPageByTab] = useState<Record<TabKey, number>>({
    rootCategories: 10,
    categories: 10,
    rootSubjects: 10,
    subjects: 10,
    relationships: 10,
    diagrams: 10,
  });

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentEntity, setCurrentEntity] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEntity, setDetailEntity] = useState<any>(null);
  const [detailTitle, setDetailTitle] = useState('');

  const ckEditorConfig = useMemo(
    () => ({
      plugins: Editor.plugins,
      toolbar: Editor.toolbar,
      licenseKey: 'GPL',
    }),
    []
  );

  const stripHtml = (value: string): string => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const truncateText = (value: unknown, maxLength = 56): string => {
    if (value === null || value === undefined) return '-';
    const normalized = typeof value === 'string' ? stripHtml(value) : String(value);
    if (!normalized) return '-';
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  };

  const renderEllipsisCell = (value: unknown, maxLength = 56) => (
    <Box title={typeof value === 'string' ? stripHtml(value) : String(value || '')} sx={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {truncateText(value, maxLength)}
    </Box>
  );

  const toStringArray = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const deriveRootCode = (rawValue?: string) => {
    if (!rawValue) return '';
    const value = rawValue.trim();
    if (/^[A-Z0-9_]{1,6}$/.test(value)) return value;
    const parts = value.split(/[^A-Za-z0-9]+/).filter(Boolean);
    const initials = parts.map((part) => part[0]).join('');
    if (initials.length >= 3) return initials.toUpperCase();
    const compact = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (compact.length >= 3) return compact.slice(0, 3);
    return (compact + 'XXX').slice(0, 3);
  };

  const deriveRelationshipCode = (semanticType?: string, name?: string) => {
    if (!name) return '';
    // Clean and uppercase the name
    const nameClean = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // If semantic_type is provided, use it as prefix
    if (semanticType) {
      const typeClean = semanticType.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      // Get first 3 letters of semantic type
      const typePrefix = typeClean.substring(0, 3);
      return `${typePrefix}-${nameClean}`;
    }
    // If no semantic type, just return the clean name
    return nameClean;
  };

  const getRootCategoryCode = (rootCategoryId?: string) => {
    if (!rootCategoryId) return '';
    const root = rootCategories.find((item) => item.id === rootCategoryId);
    return root?.code || root?.id || '';
  };

  const getRootSubjectCode = (rootSubjectId?: number) => {
    if (!rootSubjectId) return '';
    const root = rootSubjects.find((item) => item.id === rootSubjectId);
    return root?.code || '';
  };

  const computeCategoryCode = (rootCategoryId?: string, level?: number) => {
    const rootCode = getRootCategoryCode(rootCategoryId);
    const normalizedLevel = level ?? 1;
    if (!rootCode) return '';
    return `CAT-${rootCode}-${normalizedLevel}`;
  };

  const computeNextSubjectCode = (rootSubjectId?: number, existingCode?: string) => {
    const rootCode = getRootSubjectCode(rootSubjectId);
    if (!rootCode) return '';
    if (existingCode && existingCode.startsWith(`SUB-${rootCode}-`)) {
      return existingCode;
    }
    const prefix = `SUB-${rootCode}-`;
    const maxSeq = subjects.reduce((maxValue, item) => {
      if (!item.code || !item.code.startsWith(prefix)) return maxValue;
      const suffix = item.code.slice(prefix.length);
      const seq = Number.parseInt(suffix, 10);
      if (Number.isNaN(seq)) return maxValue;
      return Math.max(maxValue, seq);
    }, 0);
    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  };

  const deriveDiagramTriggerCode = (
    diagramId?: string,
    rootCategoryId?: string,
    categoryName?: string
  ) => {
    const clean = (value?: string, fallback = '', length = 0) => {
      const normalized = (value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (!length) return normalized || fallback;
      return (normalized || fallback).slice(0, length).padEnd(length, fallback[fallback.length - 1] || 'X');
    };

    const rootCode = clean(rootCategoryId, 'UNK', 3);
    const categoryCode = clean(categoryName, 'UNKN', 4);
    const idCode = clean(diagramId, 'UNKNOWN', 8).slice(0, 8);
    return `TRG-${rootCode}-${categoryCode}-${idCode}`;
  };

  // Load data
  const loadRootCategories = async () => {
    try {
      const response = await entityService.getRootCategories();
      setRootCategories(response.data);
    } catch (err: any) {
      setError('Failed to load root categories');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await entityService.getCategories();
      setCategories(response.data);
    } catch (err: any) {
      setError('Failed to load categories');
    }
  };

  const loadRootSubjects = async () => {
    try {
      const response = await entityService.getRootSubjects();
      setRootSubjects(response.data);
    } catch (err: any) {
      setError('Failed to load root subjects');
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await entityService.getSubjects();
      setSubjects(response.data);
    } catch (err: any) {
      setError('Failed to load subjects');
    }
  };

  const loadRelationships = async () => {
    try {
      const response = await entityService.getRelationships();
      setRelationships(response.data);
    } catch (err: any) {
      setError('Failed to load relationships');
    }
  };

  const loadDiagrams = async () => {
    try {
      const response = await entityService.getDiagrams();
      setDiagrams(response.data);
    } catch (err: any) {
      setError('Failed to load diagrams');
    }
  };

  useEffect(() => {
    loadRootCategories();
    loadCategories();
    loadRootSubjects();
    loadSubjects();
    loadRelationships();
    loadDiagrams();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  const handleOpenDialog = (mode: 'create' | 'edit', entity?: any) => {
    setDialogMode(mode);
    const nextEntity = entity ? { ...entity } : {};
    if (tabValue === 0 && !nextEntity.code) {
      nextEntity.code = deriveRootCode(nextEntity.id || nextEntity.name || '');
    }
    if (tabValue === 2 && !nextEntity.code) {
      nextEntity.code = deriveRootCode(nextEntity.name || '');
    }
    if (tabValue === 3) {
      nextEntity.synonyms = toStringArray(nextEntity.synonyms);
      nextEntity.categories = toStringArray(nextEntity.categories);
    }
    if (tabValue === 5 && !nextEntity.trigger_code) {
      nextEntity.trigger_code = deriveDiagramTriggerCode(
        nextEntity.id,
        nextEntity.root_category_id,
        nextEntity.category_name
      );
    }
    if (tabValue === 5) {
      nextEntity.description = nextEntity.description || '';
      nextEntity.path_pdf = nextEntity.path_pdf || '';
    }
    setCurrentEntity(nextEntity);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentEntity(null);
  };

  const handleOpenDetail = (title: string, entity: any) => {
    setDetailTitle(title);
    setDetailEntity(entity);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailEntity(null);
    setDetailTitle('');
  };

  const handleSave = async () => {
    try {
      if (tabValue === 0) {
        // RootCategory
        if (dialogMode === 'create') {
          await entityService.createRootCategory(currentEntity);
        } else {
          await entityService.updateRootCategory(currentEntity.id, currentEntity);
        }
        await loadRootCategories();
        setSuccess('Root Category saved successfully');
      } else if (tabValue === 1) {
        // Category
        if (dialogMode === 'create') {
          await entityService.createCategory(currentEntity);
        } else {
          await entityService.updateCategory(currentEntity.id, currentEntity);
        }
        await loadCategories();
        setSuccess('Category saved successfully');
      } else if (tabValue === 2) {
        // RootSubject
        if (dialogMode === 'create') {
          await entityService.createRootSubject(currentEntity);
        } else {
          await entityService.updateRootSubject(currentEntity.id, currentEntity);
        }
        await loadRootSubjects();
        setSuccess('Root Subject saved successfully');
      } else if (tabValue === 3) {
        // Subject
        const subjectPayload = {
          ...currentEntity,
          synonyms: toStringArray(currentEntity.synonyms),
          categories: toStringArray(currentEntity.categories),
        };
        if (dialogMode === 'create') {
          await entityService.createSubject(subjectPayload);
        } else {
          await entityService.updateSubject(currentEntity.id, subjectPayload);
        }
        await loadSubjects();
        setSuccess('Subject saved successfully');
      } else if (tabValue === 4) {
        // Relationship
        const relationshipData = { ...currentEntity };
        // Let backend auto-generate code when updating
        if (dialogMode === 'create') {
          await entityService.createRelationship(relationshipData);
        } else {
          // Remove code field for update to allow backend to regenerate
          delete relationshipData.code;
          await entityService.updateRelationship(currentEntity.id, relationshipData);
        }
        await loadRelationships();
        setSuccess('Relationship saved successfully');
      } else if (tabValue === 5) {
        // Diagram
        if (dialogMode === 'create') {
          await entityService.createDiagram(currentEntity);
        } else {
          await entityService.updateDiagram(currentEntity.id, currentEntity);
        }
        await loadDiagrams();
        setSuccess('Diagram saved successfully');
      }
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save entity');
    }
  };

  const handleDelete = async (id: string | number, type: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      if (type === 'rootCategory') {
        await entityService.deleteRootCategory(id as string);
        await loadRootCategories();
      } else if (type === 'category') {
        await entityService.deleteCategory(id as number);
        await loadCategories();
      } else if (type === 'rootSubject') {
        await entityService.deleteRootSubject(id as number);
        await loadRootSubjects();
      } else if (type === 'subject') {
        await entityService.deleteSubject(id as number);
        await loadSubjects();
      } else if (type === 'relationship') {
        await entityService.deleteRelationship(id as number);
        await loadRelationships();
      } else if (type === 'diagram') {
        await entityService.deleteDiagram(id as string);
        await loadDiagrams();
      }
      setSuccess('Entity deleted successfully');
    } catch (err: any) {
      setError('Failed to delete entity');
    }
  };

  const filteredUploadCategories = useMemo(() => {
    if (!uploadRootCategoryId) return [];
    return categories.filter((item) => item.root_category_id === uploadRootCategoryId);
  }, [categories, uploadRootCategoryId]);

  const normalizeFieldValue = (item: any, field: string): string => {
    const rawValue = item?.[field];
    if (field === 'synonyms' || field === 'categories') {
      return toStringArray(rawValue).join(', ');
    }
    if (field === 'description' && typeof rawValue === 'string') {
      return stripHtml(rawValue);
    }
    if (typeof rawValue === 'boolean') {
      return rawValue ? 'yes' : 'no';
    }
    if (rawValue === null || rawValue === undefined) {
      return '';
    }
    return String(rawValue);
  };

  const applyFiltersAndSearch = (items: any[], tabKey: TabKey) => {
    const searchValue = (searchByTab[tabKey] || '').trim().toLowerCase();
    const filterField = filterFieldByTab[tabKey];
    const filterValue = (filterValueByTab[tabKey] || '').trim().toLowerCase();
    const searchableFields = TAB_FILTER_CONFIG[tabKey].searchFields;

    return items.filter((item) => {
      const searchHit =
        !searchValue ||
        searchableFields.some((field) => normalizeFieldValue(item, field).toLowerCase().includes(searchValue));

      const filterHit =
        !filterValue || normalizeFieldValue(item, filterField).toLowerCase().includes(filterValue);

      return searchHit && filterHit;
    });
  };

  const getSafePage = (tabKey: TabKey, totalItems: number) => {
    const rowsPerPage = rowsPerPageByTab[tabKey];
    const maxPage = Math.max(0, Math.ceil(totalItems / rowsPerPage) - 1);
    return Math.min(pageByTab[tabKey], maxPage);
  };

  const paginate = <T,>(items: T[], tabKey: TabKey) => {
    const safePage = getSafePage(tabKey, items.length);
    const rowsPerPage = rowsPerPageByTab[tabKey];
    const start = safePage * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  };

  const filteredRootCategories = useMemo(() => applyFiltersAndSearch(rootCategories, 'rootCategories'), [rootCategories, searchByTab, filterFieldByTab, filterValueByTab]);
  const filteredCategories = useMemo(() => applyFiltersAndSearch(categories, 'categories'), [categories, searchByTab, filterFieldByTab, filterValueByTab]);
  const filteredRootSubjects = useMemo(() => applyFiltersAndSearch(rootSubjects, 'rootSubjects'), [rootSubjects, searchByTab, filterFieldByTab, filterValueByTab]);
  const filteredSubjects = useMemo(() => applyFiltersAndSearch(subjects, 'subjects'), [subjects, searchByTab, filterFieldByTab, filterValueByTab]);
  const filteredRelationships = useMemo(() => applyFiltersAndSearch(relationships, 'relationships'), [relationships, searchByTab, filterFieldByTab, filterValueByTab]);
  const filteredDiagrams = useMemo(() => applyFiltersAndSearch(diagrams, 'diagrams'), [diagrams, searchByTab, filterFieldByTab, filterValueByTab]);

  const pagedRootCategories = useMemo(() => paginate(filteredRootCategories, 'rootCategories'), [filteredRootCategories, pageByTab, rowsPerPageByTab]);
  const pagedCategories = useMemo(() => paginate(filteredCategories, 'categories'), [filteredCategories, pageByTab, rowsPerPageByTab]);
  const pagedRootSubjects = useMemo(() => paginate(filteredRootSubjects, 'rootSubjects'), [filteredRootSubjects, pageByTab, rowsPerPageByTab]);
  const pagedSubjects = useMemo(() => paginate(filteredSubjects, 'subjects'), [filteredSubjects, pageByTab, rowsPerPageByTab]);
  const pagedRelationships = useMemo(() => paginate(filteredRelationships, 'relationships'), [filteredRelationships, pageByTab, rowsPerPageByTab]);
  const pagedDiagrams = useMemo(() => paginate(filteredDiagrams, 'diagrams'), [filteredDiagrams, pageByTab, rowsPerPageByTab]);

  const renderTableControls = (tabKey: TabKey) => (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 2fr auto' } }}>
        <TextField
          label="Search"
          placeholder="Type to search..."
          value={searchByTab[tabKey]}
          onChange={(e) => {
            const value = e.target.value;
            setSearchByTab((prev) => ({ ...prev, [tabKey]: value }));
            setPageByTab((prev) => ({ ...prev, [tabKey]: 0 }));
          }}
          fullWidth
        />
        <TextField
          select
          label="Filter field"
          value={filterFieldByTab[tabKey]}
          onChange={(e) => {
            setFilterFieldByTab((prev) => ({ ...prev, [tabKey]: e.target.value }));
            setPageByTab((prev) => ({ ...prev, [tabKey]: 0 }));
          }}
          fullWidth
        >
          {TAB_FILTER_CONFIG[tabKey].filterOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Filter value"
          placeholder="Type value..."
          value={filterValueByTab[tabKey]}
          onChange={(e) => {
            const value = e.target.value;
            setFilterValueByTab((prev) => ({ ...prev, [tabKey]: value }));
            setPageByTab((prev) => ({ ...prev, [tabKey]: 0 }));
          }}
          fullWidth
        />
        <Button
          variant="outlined"
          onClick={() => {
            setSearchByTab((prev) => ({ ...prev, [tabKey]: '' }));
            setFilterValueByTab((prev) => ({ ...prev, [tabKey]: '' }));
            setPageByTab((prev) => ({ ...prev, [tabKey]: 0 }));
          }}
        >
          Reset
        </Button>
      </Box>
    </Paper>
  );

  const handleUploadDiagram = async () => {
    if (!uploadRootCategoryId) {
      setError('Please choose root category');
      return;
    }
    if (!uploadCategoryId) {
      setError('Please choose category');
      return;
    }
    if (!uploadFile) {
      setError('Please choose an image file');
      return;
    }

    const selectedCategory = categories.find((item) => item.id === uploadCategoryId);
    if (!selectedCategory) {
      setError('Selected category is invalid');
      return;
    }

    try {
      await entityService.uploadDiagram({
        root_category_id: uploadRootCategoryId,
        category_id: selectedCategory.id,
        category_name: selectedCategory.name,
        diagram_id: uploadDiagramId.trim() || undefined,
        processed: uploadProcessed,
        image: uploadFile,
      });

      setUploadDiagramId('');
      setUploadFile(null);
      setUploadProcessed(true);
      await loadDiagrams();
      setSuccess('Diagram uploaded and synchronized successfully');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload diagram');
    }
  };

  const renderEntityForm = () => {
    if (!currentEntity) return null;

    const handleFieldChange = (field: string, value: any) => {
      const nextEntity = { ...currentEntity, [field]: value };
      if (tabValue === 0 && (field === 'id' || field === 'name')) {
        if (!nextEntity.code || nextEntity.code === deriveRootCode(currentEntity?.id || currentEntity?.name || '')) {
          nextEntity.code = deriveRootCode(nextEntity.id || nextEntity.name || '');
        }
      }
      if (tabValue === 2 && field === 'name') {
        if (!nextEntity.code || nextEntity.code === deriveRootCode(currentEntity?.name || '')) {
          nextEntity.code = deriveRootCode(nextEntity.name || '');
        }
      }
      if (tabValue === 1 && (field === 'root_category_id' || field === 'level')) {
        nextEntity.code = computeCategoryCode(nextEntity.root_category_id, nextEntity.level);
      }
      if (tabValue === 3 && field === 'root_subject_id') {
        nextEntity.code = computeNextSubjectCode(nextEntity.root_subject_id, nextEntity.code);
      }
      if (tabValue === 5) {
        if (field === 'root_category_id') {
          nextEntity.category_id = null;
          nextEntity.category_name = '';
        }
        if (field === 'category_id') {
          const selectedCategory = categories.find((item) => item.id === value);
          nextEntity.category_name = selectedCategory?.name || '';
        }
        nextEntity.trigger_code = deriveDiagramTriggerCode(
          nextEntity.id,
          nextEntity.root_category_id,
          nextEntity.category_name
        );
      }
      setCurrentEntity(nextEntity);
    };

    if (tabValue === 0) {
      // RootCategory form
      return (
        <>
          <TextField
            fullWidth
            label="ID"
            value={currentEntity.id || ''}
            onChange={(e) => handleFieldChange('id', e.target.value)}
            disabled={dialogMode === 'edit'}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Code"
            value={currentEntity.code || ''}
            onChange={(e) => handleFieldChange('code', e.target.value)}
            margin="normal"
            helperText="Optional. Leave empty to auto-generate"
          />
          <TextField
            fullWidth
            label="Name"
            value={currentEntity.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Description (HTML)
            </Typography>
            <CKEditor
              editor={Editor.ClassicEditor as any}
              config={ckEditorConfig as any}
              data={currentEntity.description || ''}
              onChange={(_event, editor) => handleFieldChange('description', editor.getData())}
            />
          </Box>
        </>
      );
    }

    if (tabValue === 1) {
      // Category form
      return (
        <>
          <TextField
            fullWidth
            label="Code"
            value={currentEntity.code || ''}
            onChange={(e) => handleFieldChange('code', e.target.value)}
            margin="normal"
            disabled
            helperText="Auto-generated from Root Category + Level"
          />
          <TextField
            fullWidth
            label="Name"
            value={currentEntity.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Root Category"
            value={currentEntity.root_category_id || ''}
            onChange={(e) => handleFieldChange('root_category_id', e.target.value)}
            margin="normal"
            helperText="Select a root category"
          >
            {rootCategories.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.code || item.id} - {item.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Level"
            type="number"
            value={currentEntity.level || 1}
            onChange={(e) => handleFieldChange('level', parseInt(e.target.value))}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Description (HTML)
            </Typography>
            <CKEditor
              editor={Editor.ClassicEditor as any}
              config={ckEditorConfig as any}
              data={currentEntity.description || ''}
              onChange={(_event, editor) => handleFieldChange('description', editor.getData())}
            />
          </Box>
        </>
      );
    }

    if (tabValue === 2) {
      // RootSubject form
      return (
        <>
          <TextField
            fullWidth
            label="Code"
            value={currentEntity.code || ''}
            onChange={(e) => handleFieldChange('code', e.target.value)}
            margin="normal"
            helperText="Optional. Leave empty to auto-generate from name"
          />
          <TextField
            fullWidth
            label="Name"
            value={currentEntity.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Description (HTML)
            </Typography>
            <CKEditor
              editor={Editor.ClassicEditor as any}
              config={ckEditorConfig as any}
              data={currentEntity.description || ''}
              onChange={(_event, editor) => handleFieldChange('description', editor.getData())}
            />
          </Box>
          <TextField
            fullWidth
            label="Parent ID"
            type="number"
            value={currentEntity.parent_id || ''}
            onChange={(e) => handleFieldChange('parent_id', e.target.value ? parseInt(e.target.value) : null)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Level"
            type="number"
            value={currentEntity.level || 0}
            onChange={(e) => handleFieldChange('level', parseInt(e.target.value))}
            margin="normal"
          />
        </>
      );
    }

    if (tabValue === 3) {
      // Subject form
      const selectedCategories = toStringArray(currentEntity.categories);
      return (
        <>
          <TextField
            fullWidth
            label="Code"
            value={currentEntity.code || ''}
            onChange={(e) => handleFieldChange('code', e.target.value)}
            margin="normal"
            disabled
            helperText="Auto-generated from Root Subject"
          />
          <TextField
            fullWidth
            label="Name"
            value={currentEntity.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Root Subject"
            value={currentEntity.root_subject_id || ''}
            onChange={(e) => handleFieldChange('root_subject_id', e.target.value ? parseInt(e.target.value) : null)}
            margin="normal"
            helperText="Select a root subject"
          >
            {rootSubjects.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.id} - {item.name}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Description (HTML)
            </Typography>
            <CKEditor
              editor={Editor.ClassicEditor as any}
              config={ckEditorConfig as any}
              data={currentEntity.description || ''}
              onChange={(_event, editor) => handleFieldChange('description', editor.getData())}
            />
          </Box>
          <TextField
            fullWidth
            label="Synonyms"
            value={toStringArray(currentEntity.synonyms).join(', ')}
            onChange={(e) => handleFieldChange('synonyms', toStringArray(e.target.value))}
            margin="normal"
            helperText="Nhập danh sách synonyms, cách nhau bởi dấu phẩy"
          />
          <TextField
            fullWidth
            select
            label="Categories"
            value={selectedCategories}
            onChange={(e) => {
              const value = e.target.value;
              handleFieldChange('categories', Array.isArray(value) ? value : [value]);
            }}
            margin="normal"
            SelectProps={{
              multiple: true,
            }}
            helperText="Chọn category từ bảng categories"
          >
            {categories.map((item) => (
              <MenuItem key={item.id} value={item.name}>
                {item.code ? `${item.code} - ` : ''}
                {item.name}
              </MenuItem>
            ))}
          </TextField>
        </>
      );
    }

    if (tabValue === 4) {
      // Relationship form
      return (
        <>
          <TextField
            fullWidth
            label="Code"
            value={currentEntity.code || deriveRelationshipCode(currentEntity.semantic_type, currentEntity.name)}
            onChange={(e) => handleFieldChange('code', e.target.value)}
            margin="normal"
            helperText="Auto-generated from Semantic Type + Name. Leave empty to auto-generate"
          />
          <TextField
            fullWidth
            label="Name"
            value={currentEntity.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Semantic Type"
            value={currentEntity.semantic_type || ''}
            onChange={(e) => handleFieldChange('semantic_type', e.target.value)}
            margin="normal"
            placeholder="e.g., trophic, spatial, temporal"
            helperText="Used to generate relationship code"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Description (HTML)
            </Typography>
            <CKEditor
              editor={Editor.ClassicEditor as any}
              config={ckEditorConfig as any}
              data={currentEntity.description || ''}
              onChange={(_event, editor) => handleFieldChange('description', editor.getData())}
            />
          </Box>
          <TextField
            fullWidth
            label="Inverse Relationship"
            value={currentEntity.inverse_relationship || ''}
            onChange={(e) => handleFieldChange('inverse_relationship', e.target.value)}
            margin="normal"
          />
          {currentEntity.name && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Generated Code Preview: <strong>{deriveRelationshipCode(currentEntity.semantic_type, currentEntity.name)}</strong>
            </Alert>
          )}
        </>
      );
    }

    if (tabValue === 5) {
      // Diagram form
      const selectedRootCategoryId = currentEntity.root_category_id || '';
      const diagramCategories = categories.filter(
        (item) => item.root_category_id === selectedRootCategoryId
      );

      return (
        <>
          <TextField
            fullWidth
            label="ID"
            value={currentEntity.id || ''}
            onChange={(e) => handleFieldChange('id', e.target.value)}
            disabled={dialogMode === 'edit'}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Root Category"
            value={selectedRootCategoryId}
            onChange={(e) => handleFieldChange('root_category_id', e.target.value)}
            margin="normal"
            helperText="Select root category"
          >
            {rootCategories.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name} ({item.id})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Category"
            value={currentEntity.category_id || ''}
            onChange={(e) =>
              handleFieldChange('category_id', e.target.value ? parseInt(e.target.value, 10) : null)
            }
            margin="normal"
            disabled={!selectedRootCategoryId}
            helperText="Select category from selected root category"
          >
            {diagramCategories.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name} (ID: {item.id})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Category Name"
            value={currentEntity.category_name || ''}
            margin="normal"
            disabled
          />
          <TextField
            fullWidth
            label="Trigger Code"
            value={currentEntity.trigger_code || ''}
            margin="normal"
            disabled
            helperText="Auto-generated from Root Category + Category + Diagram ID"
          />
          <TextField
            fullWidth
            label="Image Path"
            value={currentEntity.image_path || ''}
            onChange={(e) => handleFieldChange('image_path', e.target.value)}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Description (HTML)
            </Typography>
            <CKEditor
              editor={Editor.ClassicEditor as any}
              config={ckEditorConfig as any}
              data={currentEntity.description || ''}
              onChange={(_event, editor) => handleFieldChange('description', editor.getData())}
            />
          </Box>
          <TextField
            fullWidth
            label="PDF Link"
            value={currentEntity.path_pdf || ''}
            onChange={(e) => handleFieldChange('path_pdf', e.target.value)}
            margin="normal"
            placeholder="https://.../document.pdf"
          />
        </>
      );
    }

    return null;
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Entity Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Root Categories" />
          <Tab label="Categories" />
          <Tab label="Root Subjects" />
          <Tab label="Subjects" />
          <Tab label="Relationships" />
          <Tab label="Diagrams" />
        </Tabs>
      </Box>

      {/* Root Categories */}
      <TabPanel value={tabValue} index={0}>
        {renderTableControls('rootCategories')}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ mb: 2 }}
        >
          Add Root Category
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedRootCategories.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{renderEllipsisCell(item.description, 52)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDetail('Root Category Detail', item)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog('edit', item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id, 'rootCategory')}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredRootCategories.length}
          page={getSafePage('rootCategories', filteredRootCategories.length)}
          onPageChange={(_event, newPage) => setPageByTab((prev) => ({ ...prev, rootCategories: newPage }))}
          rowsPerPage={rowsPerPageByTab.rootCategories}
          onRowsPerPageChange={(event) => {
            const value = parseInt(event.target.value, 10);
            setRowsPerPageByTab((prev) => ({ ...prev, rootCategories: value }));
            setPageByTab((prev) => ({ ...prev, rootCategories: 0 }));
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TabPanel>

      {/* Categories */}
      <TabPanel value={tabValue} index={1}>
        {renderTableControls('categories')}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ mb: 2 }}
        >
          Add Category
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Root Category ID</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedCategories.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.root_category_id}</TableCell>
                  <TableCell>{item.level}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDetail('Category Detail', item)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog('edit', item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id, 'category')}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredCategories.length}
          page={getSafePage('categories', filteredCategories.length)}
          onPageChange={(_event, newPage) => setPageByTab((prev) => ({ ...prev, categories: newPage }))}
          rowsPerPage={rowsPerPageByTab.categories}
          onRowsPerPageChange={(event) => {
            const value = parseInt(event.target.value, 10);
            setRowsPerPageByTab((prev) => ({ ...prev, categories: value }));
            setPageByTab((prev) => ({ ...prev, categories: 0 }));
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TabPanel>

      {/* Root Subjects */}
      <TabPanel value={tabValue} index={2}>
        {renderTableControls('rootSubjects')}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ mb: 2 }}
        >
          Add Root Subject
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Parent ID</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedRootSubjects.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{renderEllipsisCell(item.description, 52)}</TableCell>
                  <TableCell>{item.parent_id}</TableCell>
                  <TableCell>{item.level}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDetail('Root Subject Detail', item)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog('edit', item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id, 'rootSubject')}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredRootSubjects.length}
          page={getSafePage('rootSubjects', filteredRootSubjects.length)}
          onPageChange={(_event, newPage) => setPageByTab((prev) => ({ ...prev, rootSubjects: newPage }))}
          rowsPerPage={rowsPerPageByTab.rootSubjects}
          onRowsPerPageChange={(event) => {
            const value = parseInt(event.target.value, 10);
            setRowsPerPageByTab((prev) => ({ ...prev, rootSubjects: value }));
            setPageByTab((prev) => ({ ...prev, rootSubjects: 0 }));
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TabPanel>

      {/* Subjects */}
      <TabPanel value={tabValue} index={3}>
        {renderTableControls('subjects')}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ mb: 2 }}
        >
          Add Subject
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Root Subject ID</TableCell>
                <TableCell>Synonyms</TableCell>
                <TableCell>Categories</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedSubjects.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.root_subject_id}</TableCell>
                  <TableCell>{renderEllipsisCell(toStringArray(item.synonyms).join(', '), 40)}</TableCell>
                  <TableCell>{renderEllipsisCell(toStringArray(item.categories).join(', '), 40)}</TableCell>
                  <TableCell>{renderEllipsisCell(item.description, 52)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDetail('Subject Detail', item)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog('edit', item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id, 'subject')}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredSubjects.length}
          page={getSafePage('subjects', filteredSubjects.length)}
          onPageChange={(_event, newPage) => setPageByTab((prev) => ({ ...prev, subjects: newPage }))}
          rowsPerPage={rowsPerPageByTab.subjects}
          onRowsPerPageChange={(event) => {
            const value = parseInt(event.target.value, 10);
            setRowsPerPageByTab((prev) => ({ ...prev, subjects: value }));
            setPageByTab((prev) => ({ ...prev, subjects: 0 }));
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TabPanel>

      {/* Relationships */}
      <TabPanel value={tabValue} index={4}>
        {renderTableControls('relationships')}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ mb: 2 }}
        >
          Add Relationship
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Semantic Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedRelationships.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{renderEllipsisCell(item.description, 52)}</TableCell>
                  <TableCell>{item.semantic_type}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDetail('Relationship Detail', item)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog('edit', item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id, 'relationship')}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredRelationships.length}
          page={getSafePage('relationships', filteredRelationships.length)}
          onPageChange={(_event, newPage) => setPageByTab((prev) => ({ ...prev, relationships: newPage }))}
          rowsPerPage={rowsPerPageByTab.relationships}
          onRowsPerPageChange={(event) => {
            const value = parseInt(event.target.value, 10);
            setRowsPerPageByTab((prev) => ({ ...prev, relationships: value }));
            setPageByTab((prev) => ({ ...prev, relationships: 0 }));
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TabPanel>

      {/* Diagrams */}
      <TabPanel value={tabValue} index={5}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Upload Diagram Image
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            <TextField
              select
              label="Root Category"
              value={uploadRootCategoryId}
              onChange={(e) => {
                setUploadRootCategoryId(e.target.value);
                setUploadCategoryId('');
              }}
              fullWidth
            >
              {rootCategories.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} ({item.id})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Category"
              value={uploadCategoryId}
              onChange={(e) => setUploadCategoryId(e.target.value ? parseInt(e.target.value, 10) : '')}
              fullWidth
              disabled={!uploadRootCategoryId}
            >
              {filteredUploadCategories.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} (ID: {item.id})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Diagram ID (optional, e.g. 1701.png)"
              value={uploadDiagramId}
              onChange={(e) => setUploadDiagramId(e.target.value)}
              fullWidth
            />

            <Box>
              <Button variant="outlined" component="label" fullWidth sx={{ height: 56 }}>
                {uploadFile ? `Selected: ${uploadFile.name}` : 'Choose Diagram Image'}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </Button>
            </Box>
          </Box>

          <FormControlLabel
            sx={{ mt: 1 }}
            control={<Checkbox checked={uploadProcessed} onChange={(e) => setUploadProcessed(e.target.checked)} />}
            label="Mark as processed"
          />

          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleUploadDiagram} disabled={!uploadFile}>
              Upload Diagram
            </Button>
          </Box>
        </Paper>

        {renderTableControls('diagrams')}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ mb: 2 }}
        >
          Add Diagram
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Root Category</TableCell>
                <TableCell>Category Name</TableCell>
                <TableCell>Trigger Code</TableCell>
                <TableCell>Image Path</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>PDF Link</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedDiagrams.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.root_category_id || '-'}</TableCell>
                  <TableCell>{item.category_name || '-'}</TableCell>
                  <TableCell>{item.trigger_code || '-'}</TableCell>
                  <TableCell>{renderEllipsisCell(item.image_path, 30)}</TableCell>
                  <TableCell>{renderEllipsisCell(item.description, 20)}</TableCell>
                  <TableCell>{renderEllipsisCell(item.path_pdf, 20)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDetail('Diagram Detail', item)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog('edit', item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id, 'diagram')}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredDiagrams.length}
          page={getSafePage('diagrams', filteredDiagrams.length)}
          onPageChange={(_event, newPage) => setPageByTab((prev) => ({ ...prev, diagrams: newPage }))}
          rowsPerPage={rowsPerPageByTab.diagrams}
          onRowsPerPageChange={(event) => {
            const value = parseInt(event.target.value, 10);
            setRowsPerPageByTab((prev) => ({ ...prev, diagrams: value }));
            setPageByTab((prev) => ({ ...prev, diagrams: 0 }));
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </TabPanel>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Create' : 'Edit'} Entity</DialogTitle>
        <DialogContent>{renderEntityForm()}</DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>{detailTitle}</DialogTitle>
        <DialogContent dividers>
          {detailEntity && (
            <Stack spacing={2}>
              {Object.entries(detailEntity).map(([key, value]) => {
                if (value === null || value === undefined || value === '') return null;

                if (key === 'description' && typeof value === 'string') {
                  return (
                    <Box key={key}>
                      <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                        {key}
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, maxHeight: 320, overflow: 'auto' }}>
                        <Box dangerouslySetInnerHTML={{ __html: value }} />
                      </Paper>
                    </Box>
                  );
                }

                if (key === 'path_pdf' && typeof value === 'string') {
                  return (
                    <Box key={key}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5, textTransform: 'capitalize' }}>
                        {key}
                      </Typography>
                      <Link href={value} target="_blank" rel="noopener noreferrer">
                        {value}
                      </Link>
                    </Box>
                  );
                }

                const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                return (
                  <Box key={key}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, textTransform: 'capitalize' }}>
                      {key}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {displayValue}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
