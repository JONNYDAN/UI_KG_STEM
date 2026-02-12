import axios from 'axios';
import { useState, useEffect } from 'react';

import {  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  Chip,
  CircularProgress,
} from '@mui/material';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Relationship {
  id: number;
  name: string;
  code: string;
}

interface SRO {
  id: number;
  code: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  relationship_id: number;
  relationship_name: string;
  relationship_code: string;
  object_id: number;
  object_name: string;
  object_code: string;
  diagram_id?: string;
  confidence_score?: number;
  context?: string;
  created_at?: string;
}

export function SROManagementView() {
  const [sros, setSros] = useState<SRO[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    id: 0,
    subject_id: 0,
    relationship_id: 0,
    object_id: 0,
    diagram_id: '',
    confidence_score: 1.0,
    context: '',
  });

  // Load data
  const loadSROs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/integration/sro/list`);
      if (response.data.success) {
        setSros(response.data.data);
      }
    } catch (err: any) {
      setError('Failed to load SROs: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/postgres/subjects`);
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load subjects:', err);
    }
  };

  const loadRelationships = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/postgres/relationships`);
      if (response.data.success) {
        setRelationships(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load relationships:', err);
    }
  };

  useEffect(() => {
    loadSROs();
    loadSubjects();
    loadRelationships();
  }, []);

  const handleOpenDialog = (mode: 'create' | 'edit', sro?: SRO) => {
    setDialogMode(mode);
    if (sro) {
      setFormData({
        id: sro.id,
        subject_id: sro.subject_id,
        relationship_id: sro.relationship_id,
        object_id: sro.object_id,
        diagram_id: sro.diagram_id || '',
        confidence_score: sro.confidence_score || 1.0,
        context: sro.context || '',
      });
    } else {
      setFormData({
        id: 0,
        subject_id: 0,
        relationship_id: 0,
        object_id: 0,
        diagram_id: '',
        confidence_score: 1.0,
        context: '',
      });
    }
    setDialogOpen(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      id: 0,
      subject_id: 0,
      relationship_id: 0,
      object_id: 0,
      diagram_id: '',
      confidence_score: 1.0,
      context: '',
    });
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    try {
      if (dialogMode === 'create') {
        const params = new URLSearchParams({
          subject_id: formData.subject_id.toString(),
          relationship_id: formData.relationship_id.toString(),
          object_id: formData.object_id.toString(),
        });
        
        if (formData.diagram_id) params.append('diagram_id', formData.diagram_id);
        if (formData.confidence_score) params.append('confidence_score', formData.confidence_score.toString());
        if (formData.context) params.append('context', formData.context);
        
        const response = await axios.post(`${API_BASE_URL}/api/integration/sro/create?${params.toString()}`);
        
        if (response.data.success) {
          setSuccess('SRO created and synced successfully!');
          loadSROs();
          setTimeout(() => {
            handleCloseDialog();
            setSuccess('');
          }, 2000);
        }
      } else {
        const params = new URLSearchParams();
        
        if (formData.subject_id) params.append('subject_id', formData.subject_id.toString());
        if (formData.relationship_id) params.append('relationship_id', formData.relationship_id.toString());
        if (formData.object_id) params.append('object_id', formData.object_id.toString());
        if (formData.diagram_id) params.append('diagram_id', formData.diagram_id);
        if (formData.confidence_score) params.append('confidence_score', formData.confidence_score.toString());
        if (formData.context) params.append('context', formData.context);
        
        const response = await axios.put(
          `${API_BASE_URL}/api/integration/sro/${formData.id}?${params.toString()}`
        );
        
        if (response.data.success) {
          setSuccess('SRO updated and synced successfully!');
          loadSROs();
          setTimeout(() => {
            handleCloseDialog();
            setSuccess('');
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this triple?')) return;
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/integration/sro/${id}`);
      if (response.data.success) {
        setSuccess('SRO deleted successfully!');
        loadSROs();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Subject-Relationship-Object Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
          >
            Create Triple
          </Button>
        </Box>

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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Relationship</TableCell>
                  <TableCell>Object</TableCell>
                  <TableCell>Diagram ID</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No triples found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  sros.map((sro) => (
                    <TableRow key={sro.id}>
                      <TableCell>{sro.id}</TableCell>
                      <TableCell>
                        <Chip label={sro.code} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{sro.subject_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sro.subject_code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{sro.relationship_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sro.relationship_code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{sro.object_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sro.object_code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{sro.diagram_id || '-'}</TableCell>
                      <TableCell>
                        {sro.confidence_score ? (sro.confidence_score * 100).toFixed(0) + '%' : '-'}
                      </TableCell>
                      <TableCell>
                        {sro.created_at ? new Date(sro.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', sro)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(sro.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {dialogMode === 'create' ? 'Create New Triple' : 'Edit Triple'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                select
                label="Subject"
                value={formData.subject_id}
                onChange={(e) =>
                  setFormData({ ...formData, subject_id: Number(e.target.value) })
                }
                fullWidth
                required
              >
                <MenuItem value={0}>Select Subject</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Relationship"
                value={formData.relationship_id}
                onChange={(e) =>
                  setFormData({ ...formData, relationship_id: Number(e.target.value) })
                }
                fullWidth
                required
              >
                <MenuItem value={0}>Select Relationship</MenuItem>
                {relationships.map((rel) => (
                  <MenuItem key={rel.id} value={rel.id}>
                    {rel.name} ({rel.code})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Object"
                value={formData.object_id}
                onChange={(e) =>
                  setFormData({ ...formData, object_id: Number(e.target.value) })
                }
                fullWidth
                required
              >
                <MenuItem value={0}>Select Object</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Diagram ID (Optional)"
                value={formData.diagram_id}
                onChange={(e) => setFormData({ ...formData, diagram_id: e.target.value })}
                fullWidth
              />

              <TextField
                label="Confidence Score"
                type="number"
                inputProps={{ min: 0, max: 1, step: 0.01 }}
                value={formData.confidence_score}
                onChange={(e) =>
                  setFormData({ ...formData, confidence_score: parseFloat(e.target.value) })
                }
                fullWidth
              />

              <TextField
                label="Context (Optional)"
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              {formData.subject_id > 0 && formData.relationship_id > 0 && formData.object_id > 0 && (
                <Alert severity="info">
                  <Typography variant="caption">
                    Code will be auto-generated as:{' '}
                    <strong>
                      {subjects.find((s) => s.id === formData.subject_id)?.code}_
                      {relationships.find((r) => r.id === formData.relationship_id)?.code}_
                      {subjects.find((s) => s.id === formData.object_id)?.code}
                    </strong>
                  </Typography>
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={
                !formData.subject_id || !formData.relationship_id || !formData.object_id
              }
            >
              {dialogMode === 'create' ? 'Create' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
