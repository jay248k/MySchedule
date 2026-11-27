import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  BookOpen,
  Plus,
  Search,
  Upload,
  Download,
  Eye,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Layers,
  Target,
  List,
  FileText,
  Table as TableIcon,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Menu,
  X,
  Save,
  Copy,
  ExternalLink,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import '../styles/pages/curriculum.css';

export function CurriculumPage() {
  const { showToast } = useApp();

  // Plans state
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planHierarchy, setPlanHierarchy] = useState(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ title: '', description: '', categoryId: '', goalId: '' });

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importStage, setImportStage] = useState('upload'); // 'upload' | 'preview' | 'importing' | 'done'

  // Section/Subsection/Topic/Subtopic modals
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ title: '', description: '', planId: '', orderIndex: 0 });

  const [showSubsectionModal, setShowSubsectionModal] = useState(false);
  const [editingSubsection, setEditingSubsection] = useState(null);
  const [subsectionForm, setSubsectionForm] = useState({ title: '', description: '', sectionId: '', orderIndex: 0 });

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({ title: '', description: '', subsectionId: '', orderIndex: 0 });

  const [showSubtopicModal, setShowSubtopicModal] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState(null);
  const [subtopicForm, setSubtopicForm] = useState({ title: '', description: '', topicId: '', orderIndex: 0 });

  // UI state
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'import'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const res = await api.getPlans();
      setPlans(res.data || res);
    } catch (err) {
      console.error('Failed to load plans:', err);
      showToast({ type: 'danger', title: 'Error', message: 'Failed to load plans' });
    } finally {
      setLoadingPlans(false);
    }
  }, [showToast]);

  // Fetch plan hierarchy
  const fetchPlanHierarchy = useCallback(async (planId) => {
    try {
      setLoadingHierarchy(true);
      const res = await api.getPlan(planId);
      setPlanHierarchy(res.data || res);
    } catch (err) {
      console.error('Failed to load plan hierarchy:', err);
      showToast({ type: 'danger', title: 'Error', message: 'Failed to load plan details' });
    } finally {
      setLoadingHierarchy(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (selectedPlan) {
      fetchPlanHierarchy(selectedPlan.id);
    } else {
      setPlanHierarchy(null);
    }
  }, [selectedPlan, fetchPlanHierarchy]);

  // Plan handlers
  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.updatePlan(editingPlan.id, planForm);
        showToast({ type: 'success', title: 'Updated', message: 'Plan updated successfully' });
      } else {
        await api.createPlan(planForm);
        showToast({ type: 'success', title: 'Created', message: 'Plan created successfully' });
      }
      setShowPlanModal(false);
      setEditingPlan(null);
      setPlanForm({ title: '', description: '', categoryId: '', goalId: '' });
      fetchPlans();
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message || 'Failed to save plan' });
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan? This will delete all sections, topics, and lessons.')) return;
    try {
      await api.deletePlan(planId);
      showToast({ type: 'success', title: 'Deleted', message: 'Plan deleted successfully' });
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
      }
      fetchPlans();
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message || 'Failed to delete plan' });
    }
  };

  const openPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({ title: plan.title, description: plan.description || '', categoryId: plan.categoryId || '', goalId: plan.goalId || '' });
    } else {
      setEditingPlan(null);
      setPlanForm({ title: '', description: '', categoryId: '', goalId: '' });
    }
    setShowPlanModal(true);
  };

  // Import handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setImportStage('upload');
      setImportPreview(null);
    }
  };

  const handlePreviewImport = async () => {
    if (!importFile) return;
    try {
      setImporting(true);
      const res = await api.previewCurriculumImport(importFile);
      setImportPreview(res.data || res);
      setImportStage('preview');
    } catch (err) {
      showToast({ type: 'danger', title: 'Preview Failed', message: err.message });
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) return;
    try {
      setImporting(true);
      setImportStage('importing');
      const res = await api.importCurriculum(importFile);
      showToast({ type: 'success', title: 'Import Complete', message: `Created ${res.stats?.lessons?.created || 0} lessons` });
      setImportStage('done');
      setTimeout(() => {
        setShowImportModal(false);
        setImportFile(null);
        setImportPreview(null);
        setImportStage('upload');
        fetchPlans();
      }, 2000);
    } catch (err) {
      showToast({ type: 'danger', title: 'Import Failed', message: err.message });
      setImportStage('preview');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.downloadImportTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'curriculum-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: 'Failed to download template' });
    }
  };

  // Section handlers
  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await api.updateSection(editingSection.id, sectionForm);
        showToast({ type: 'success', title: 'Updated', message: 'Section updated' });
      } else {
        await api.createSection(sectionForm);
        showToast({ type: 'success', title: 'Created', message: 'Section created' });
      }
      setShowSectionModal(false);
      setEditingSection(null);
      setSectionForm({ title: '', description: '', planId: '', orderIndex: 0 });
      fetchPlanHierarchy(selectedPlan.id);
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  const openSectionModal = (section = null, planId = '') => {
    if (section) {
      setEditingSection(section);
      setSectionForm({ title: section.title, description: section.description || '', planId: section.planId, orderIndex: section.orderIndex || 0 });
    } else {
      setEditingSection(null);
      setSectionForm({ title: '', description: '', planId, orderIndex: 0 });
    }
    setShowSectionModal(true);
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Delete this section and all its subsections?')) return;
    try {
      await api.deleteSection(sectionId);
      showToast({ type: 'success', title: 'Deleted', message: 'Section deleted' });
      fetchPlanHierarchy(selectedPlan.id);
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  // Subsection handlers
  const handleSubsectionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubsection) {
        await api.updateSubsection(editingSubsection.id, subsectionForm);
        showToast({ type: 'success', title: 'Updated', message: 'Subsection updated' });
      } else {
        await api.createSubsection(subsectionForm);
        showToast({ type: 'success', title: 'Created', message: 'Subsection created' });
      }
      setShowSubsectionModal(false);
      setEditingSubsection(null);
      setSubsectionForm({ title: '', description: '', sectionId: '', orderIndex: 0 });
      fetchPlanHierarchy(selectedPlan.id);
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  const openSubsectionModal = (subsection = null, sectionId = '') => {
    if (subsection) {
      setEditingSubsection(subsection);
      setSubsectionForm({ title: subsection.title, description: subsection.description || '', sectionId: subsection.sectionId, orderIndex: subsection.orderIndex || 0 });
    } else {
      setEditingSubsection(null);
      setSubsectionForm({ title: '', description: '', sectionId, orderIndex: 0 });
    }
    setShowSubsectionModal(true);
  };

  const handleDeleteSubsection = async (subsectionId) => {
    if (!window.confirm('Delete this subsection and all its topics?')) return;
    try {
      await api.deleteSubsection(subsectionId);
      showToast({ type: 'success', title: 'Deleted', message: 'Subsection deleted' });
      fetchPlanHierarchy(selectedPlan.id);
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  // Topic handlers
  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTopic) {
        await api.updateTopic(editingTopic.id, topicForm);
        showToast({ type: 'success', title: 'Updated', message: 'Topic updated' });
      } else {
        await api.createTopic(topicForm);
        showToast({ type: 'success', title: 'Created', message: 'Topic created' });
      }
      setShowTopicModal(false);
      setEditingTopic(null);
      setTopicForm({ title: '', description: '', subsectionId: '', orderIndex: 0 });
      fetchPlanHierarchy(selectedPlan.id);
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  const openTopicModal = (topic = null, subsectionId = '') => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({ title: topic.title, description: topic.description || '', subsectionId: topic.subsectionId, orderIndex: topic.orderIndex || 0 });
    } else {
      setEditingTopic(null);
      setTopicForm({ title: '', description: '', subsectionId, orderIndex: 0 });
    }
    setShowTopicModal(true);
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Delete this topic and all its subtopics?')) return;
    try {
      await api.deleteTopic(topicId);
      showToast({ type: 'success', title: 'Deleted', message: 'Topic deleted' });
      fetchPlanHierarchy(selectedPlan.id);
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  // Subtopic handlers
  const handleSubtopicSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubtopic) {
        await api.updateSubtopic(editingSubtopic.id, subtopicForm);
        showToast({ type: 'success', title: 'Updated', message: 'Subtopic updated' });
      } else {
        await api.createSubtopic(subtopicForm);
        showToast({ type: 'success', title: 'Created', message: 'Subtopic created' });
      }
      setShowSubtopicModal(false);
      setEditingSubtopic(null);
      setSubtopicForm({ title: '', description: '', topicId: '', orderIndex: 0 });
      fetchPlanHierarchy(selectedPlan.id);
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  const openSubtopicModal = (subtopic = null, topicId = '') => {
    if (subtopic) {
      setEditingSubtopic(subtopic);
      setSubtopicForm({ title: subtopic.title, description: subtopic.description || '', topicId: subtopic.topicId, orderIndex: subtopic.orderIndex || 0 });
    } else {
      setEditingSubtopic(null);
      setSubtopicForm({ title: '', description: '', topicId, orderIndex: 0 });
    }
    setShowSubtopicModal(true);
  };

  const handleDeleteSubtopic = async (subtopicId) => {
    if (!window.confirm('Delete this subtopic and all its lessons?')) return;
    try {
      await api.deleteSubtopic(subtopicId);
      showToast({ type: 'success', title: 'Deleted', message: 'Subtopic deleted' });
      fetchPlanHierarchy(selectedPlan.id);
    } catch (err) {
      showToast({ type: 'danger', title: 'Error', message: err.message });
    }
  };

  // Toggle node expansion
  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Render hierarchy tree
  const renderHierarchy = () => {
    if (!planHierarchy) return null;

    const renderLessons = (lessons, indent = 4) => {
      if (!lessons || lessons.length === 0) return null;
      return (
        <div className="curriculum-lessons" style={{ marginLeft: `${indent * 20}px` }}>
          {lessons.map((lesson, idx) => (
            <div key={lesson.id} className="curriculum-lesson-item">
              <span className="lesson-order">{idx + 1}.</span>
              <span className="lesson-title">{lesson.title}</span>
              {lesson.nextLessonId && <ArrowRight className="lesson-next-icon" title="Chained to next" />}
            </div>
          ))}
        </div>
      );
    };

    const renderSubtopics = (subtopics, indent = 3) => {
      if (!subtopics || subtopics.length === 0) return null;
      return (
        <div className="curriculum-subtopics" style={{ marginLeft: `${indent * 20}px` }}>
          {subtopics.map(subtopic => (
            <div key={subtopic.id} className="curriculum-node subtopic-node">
              <div className="node-header" onClick={() => toggleNode(`subtopic-${subtopic.id}`)}>
                <ChevronRight className={`node-chevron ${expandedNodes.has(`subtopic-${subtopic.id}`) ? 'expanded' : ''}`} />
                <span className="node-icon"><FileText size={16} color="#8B5CF6" /></span>
                <span className="node-title">{subtopic.title}</span>
                <span className="node-badge">Subtopic</span>
                <div className="node-actions">
                  <button onClick={(e) => { e.stopPropagation(); openSubtopicModal(subtopic, subtopic.topicId); }} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSubtopic(subtopic.id); }} title="Delete" className="danger"><Trash2 size={14} /></button>
                </div>
              </div>
              {expandedNodes.has(`subtopic-${subtopic.id}`) && renderLessons(subtopic.lessons, indent + 1)}
            </div>
          ))}
        </div>
      );
    };

    const renderTopics = (topics, indent = 2) => {
      if (!topics || topics.length === 0) return null;
      return (
        <div className="curriculum-topics" style={{ marginLeft: `${indent * 20}px` }}>
          {topics.map(topic => (
            <div key={topic.id} className="curriculum-node topic-node">
              <div className="node-header" onClick={() => toggleNode(`topic-${topic.id}`)}>
                <ChevronRight className={`node-chevron ${expandedNodes.has(`topic-${topic.id}`) ? 'expanded' : ''}`} />
                <span className="node-icon"><Target size={16} color="#EC4899" /></span>
                <span className="node-title">{topic.title}</span>
                <span className="node-badge">Topic</span>
                <div className="node-actions">
                  <button onClick={(e) => { e.stopPropagation(); openTopicModal(topic, topic.subsectionId); }} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); openSubtopicModal(null, topic.id); }} title="Add Subtopic"><Plus size={14} color="#8B5CF6" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }} title="Delete" className="danger"><Trash2 size={14} /></button>
                </div>
              </div>
              {expandedNodes.has(`topic-${topic.id}`) && renderSubtopics(topic.subtopics, indent + 1)}
            </div>
          ))}
        </div>
      );
    };

    const renderSubsections = (subsections, indent = 1) => {
      if (!subsections || subsections.length === 0) return null;
      return (
        <div className="curriculum-subsections" style={{ marginLeft: `${indent * 20}px` }}>
          {subsections.map(subsection => (
            <div key={subsection.id} className="curriculum-node subsection-node">
              <div className="node-header" onClick={() => toggleNode(`subsection-${subsection.id}`)}>
                <ChevronRight className={`node-chevron ${expandedNodes.has(`subsection-${subsection.id}`) ? 'expanded' : ''}`} />
                <span className="node-icon"><List size={16} color="#F59E0B" /></span>
                <span className="node-title">{subsection.title}</span>
                <span className="node-badge">Subsection</span>
                <div className="node-actions">
                  <button onClick={(e) => { e.stopPropagation(); openSubsectionModal(subsection, subsection.sectionId); }} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); openTopicModal(null, subsection.id); }} title="Add Topic"><Plus size={14} color="#EC4899" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSubsection(subsection.id); }} title="Delete" className="danger"><Trash2 size={14} /></button>
                </div>
              </div>
              {expandedNodes.has(`subsection-${subsection.id}`) && renderTopics(subsection.topics, indent + 1)}
            </div>
          ))}
        </div>
      );
    };

    const renderSections = (sections) => {
      if (!sections || sections.length === 0) return null;
      return (
        <div className="curriculum-sections">
          {sections.map(section => (
            <div key={section.id} className="curriculum-node section-node">
              <div className="node-header" onClick={() => toggleNode(`section-${section.id}`)}>
                <ChevronRight className={`node-chevron ${expandedNodes.has(`section-${section.id}`) ? 'expanded' : ''}`} />
                <span className="node-icon"><Layers size={16} color="#3B82F6" /></span>
                <span className="node-title">{section.title}</span>
                <span className="node-badge">Section</span>
                <div className="node-actions">
                  <button onClick={(e) => { e.stopPropagation(); openSectionModal(section, section.planId); }} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); openSubsectionModal(null, section.id); }} title="Add Subsection"><Plus size={14} color="#F59E0B" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }} title="Delete" className="danger"><Trash2 size={14} /></button>
                </div>
              </div>
              {expandedNodes.has(`section-${section.id}`) && renderSubsections(section.subsections, 1)}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="curriculum-hierarchy">
        <div className="plan-header">
          <div className="plan-info">
            <BookOpen size={24} color="#10B981" />
            <div>
              <h2>{planHierarchy.title}</h2>
              <p>{planHierarchy.description || 'No description'}</p>
            </div>
          </div>
          <div className="plan-actions">
            <button onClick={() => openSectionModal(null, planHierarchy.id)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Section
            </button>
          </div>
        </div>
        {renderSections(planHierarchy.sections)}
      </div>
    );
  };

  return (
    <div className="curriculum-page">
      {/* Header Banner Card */}
      <div className="curriculum-banner-card">
        <div className="curriculum-banner-left">
          <div className="curriculum-badge-row">
            <span className="curriculum-badge-emerald">CURRICULUM &amp; LEARNING PLANS</span>
          </div>
          <h1 className="curriculum-banner-title">
            <span className="curriculum-banner-icon">
              <BookOpen size={20} color="#10B981" />
            </span>
            <span>Curriculum Manager</span>
          </h1>
          <p className="curriculum-banner-subtitle">
            Manage learning plans, import curriculum from Excel, and build lesson chains
          </p>
        </div>
        <div className="curriculum-banner-actions">
          <button type="button" onClick={handleDownloadTemplate} className="curriculum-btn-outline">
            <Download size={15} />
            <span>Template</span>
          </button>
          <button type="button" onClick={() => setShowImportModal(true)} className="curriculum-btn-primary">
            <Upload size={15} />
            <span>Import Curriculum</span>
          </button>
          <button type="button" onClick={() => openPlanModal()} className="curriculum-btn-emerald">
            <Plus size={15} />
            <span>New Plan</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="curriculum-tabs">
        <button className={activeTab === 'plans' ? 'active' : ''} onClick={() => setActiveTab('plans')}>
          <Layers size={16} /> Plans & Hierarchy
        </button>
        <button className={activeTab === 'import' ? 'active' : ''} onClick={() => setActiveTab('import')}>
          <Upload size={16} /> Import from Excel
        </button>
      </div>

      {/* Main Content */}
      <div className="curriculum-main">
        <aside className="curriculum-sidebar" style={{ display: sidebarOpen ? 'block' : 'none' }}>
          <div className="sidebar-header">
            <h3>Learning Plans</h3>
            <button onClick={() => setSidebarOpen(false)} className="sidebar-toggle" title="Collapse">
              <ChevronLeft size={16} />
            </button>
          </div>
          {loadingPlans ? (
            <div className="loading">Loading plans...</div>
          ) : (
            <ul className="plans-list">
              {plans.map(plan => (
                <li key={plan.id} className={selectedPlan?.id === plan.id ? 'active' : ''} onClick={() => setSelectedPlan(plan)}>
                  <div className="plan-item">
                    <BookOpen size={18} color="#10B981" />
                    <span>{plan.title}</span>
                  </div>
                  <div className="plan-meta">
                    {plan.sections?.length || 0} sections
                  </div>
                </li>
              ))}
              {plans.length === 0 && <li className="empty-state">No plans yet. Create one to get started.</li>}
            </ul>
          )}
        </aside>

        <button className="sidebar-toggle-mobile" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={20} />
        </button>

        <main className="curriculum-content">
          {activeTab === 'plans' ? (
            selectedPlan ? (
              loadingHierarchy ? (
                <div className="loading-center">Loading plan hierarchy...</div>
              ) : (
                renderHierarchy()
              )
            ) : (
              <div className="empty-state-large">
                <BookOpen size={64} color="var(--text-muted)" />
                <h3>Select a Plan</h3>
                <p>Choose a plan from the sidebar to view and edit its hierarchy</p>
              </div>
            )
          ) : (
            <div className="import-panel">
              <div className="import-card">
                <h3><Upload size={20} /> Import Curriculum from Excel</h3>
                <p>Upload an Excel file with your curriculum structure. The system will automatically create Categories, Goals, Plans, Sections, Topics, Subtopics, and Lessons with proper chaining.</p>

                {importStage === 'upload' && (
                  <div className="import-step">
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="file-input" id="import-file" />
                    <label htmlFor="import-file" className="file-label">
                      <Upload size={32} />
                      <span>Choose Excel/CSV file</span>
                      <small>Supports .xlsx, .xls, .csv</small>
                    </label>
                    {importFile && (
                      <div className="file-selected">
                        <FileText size={16} /> {importFile.name}
                        <button onClick={handlePreviewImport} className="btn btn-primary" disabled={importing}>
                          {importing ? 'Previewing...' : 'Preview Import'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {importStage === 'preview' && importPreview && (
                  <div className="import-step preview-step">
                    <h4>Import Preview</h4>
                    <div className="preview-stats">
                      <div className="stat"><span>{importPreview.stats?.categories?.create || 0}</span> Categories</div>
                      <div className="stat"><span>{importPreview.stats?.goals?.create || 0}</span> Goals</div>
                      <div className="stat"><span>{importPreview.stats?.plans?.create || 0}</span> Plans</div>
                      <div className="stat"><span>{importPreview.stats?.sections?.create || 0}</span> Sections</div>
                      <div className="stat"><span>{importPreview.stats?.topics?.create || 0}</span> Topics</div>
                      <div className="stat"><span>{importPreview.stats?.subtopics?.create || 0}</span> Subtopics</div>
                      <div className="stat highlight"><span>{importPreview.stats?.lessons?.create || 0}</span> Lessons</div>
                      <div className="stat"><span>{importPreview.stats?.chains?.rebuilt || 0}</span> Chains</div>
                    </div>
                    {importPreview.validation?.warnings?.length > 0 && (
                      <div className="preview-warnings">
                        <AlertCircle size={16} />
                        <ul>{importPreview.validation.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                      </div>
                    )}
                    <div className="preview-actions">
                      <button onClick={() => { setImportStage('upload'); setImportFile(null); setImportPreview(null); }} className="btn btn-ghost">Back</button>
                      <button onClick={handleConfirmImport} className="btn btn-success" disabled={importing}>
                        {importing ? 'Importing...' : 'Confirm Import'}
                      </button>
                    </div>
                  </div>
                )}

                {importStage === 'importing' && (
                  <div className="import-step importing-step">
                    <div className="spinner" />
                    <p>Importing curriculum...</p>
                  </div>
                )}

                {importStage === 'done' && (
                  <div className="import-step done-step">
                    <CheckCircle size={48} color="#10B981" />
                    <h4>Import Complete!</h4>
                    <p>Your curriculum has been imported successfully.</p>
                  </div>
                )}
              </div>

              <div className="import-template-card">
                <h4><HelpCircle size={16} /> Need a Template?</h4>
                <p>Download the Excel template to see the required format.</p>
                <button onClick={handleDownloadTemplate} className="btn btn-outline">
                  <Download size={14} /> Download Template
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPlan ? 'Edit Plan' : 'New Plan'}</h3>
              <button onClick={() => setShowPlanModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handlePlanSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" value={planForm.title} onChange={e => setPlanForm({...planForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category ID (optional)</label>
                  <input type="text" value={planForm.categoryId} onChange={e => setPlanForm({...planForm, categoryId: e.target.value})} placeholder="Leave empty to create new" />
                </div>
                <div className="form-group">
                  <label>Goal ID (optional)</label>
                  <input type="text" value={planForm.goalId} onChange={e => setPlanForm({...planForm, goalId: e.target.value})} placeholder="Leave empty to create new" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPlanModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingPlan ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Curriculum</h3>
              <button onClick={() => setShowImportModal(false)}><X size={20} /></button>
            </div>
            <div className="import-panel" style={{ padding: 0 }}>
              <div className="import-card">
                {importStage === 'upload' && (
                  <div className="import-step">
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="file-input" id="import-file-modal" />
                    <label htmlFor="import-file-modal" className="file-label">
                      <Upload size={32} />
                      <span>Choose Excel/CSV file</span>
                      <small>Supports .xlsx, .xls, .csv</small>
                    </label>
                    {importFile && (
                      <div className="file-selected">
                        <FileText size={16} /> {importFile.name}
                        <button onClick={handlePreviewImport} className="btn btn-primary" disabled={importing}>
                          {importing ? 'Previewing...' : 'Preview Import'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {importStage === 'preview' && importPreview && (
                  <div className="import-step preview-step">
                    <h4>Import Preview</h4>
                    <div className="preview-stats">
                      <div className="stat"><span>{importPreview.stats?.categories?.create || 0}</span> Categories</div>
                      <div className="stat"><span>{importPreview.stats?.goals?.create || 0}</span> Goals</div>
                      <div className="stat"><span>{importPreview.stats?.plans?.create || 0}</span> Plans</div>
                      <div className="stat"><span>{importPreview.stats?.sections?.create || 0}</span> Sections</div>
                      <div className="stat"><span>{importPreview.stats?.topics?.create || 0}</span> Topics</div>
                      <div className="stat"><span>{importPreview.stats?.subtopics?.create || 0}</span> Subtopics</div>
                      <div className="stat highlight"><span>{importPreview.stats?.lessons?.create || 0}</span> Lessons</div>
                      <div className="stat"><span>{importPreview.stats?.chains?.rebuilt || 0}</span> Chains</div>
                    </div>
                    {importPreview.validation?.warnings?.length > 0 && (
                      <div className="preview-warnings">
                        <AlertCircle size={16} />
                        <ul>{importPreview.validation.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                      </div>
                    )}
                    <div className="preview-actions">
                      <button onClick={() => { setImportStage('upload'); setImportFile(null); setImportPreview(null); }} className="btn btn-ghost">Back</button>
                      <button onClick={handleConfirmImport} className="btn btn-success" disabled={importing}>
                        {importing ? 'Importing...' : 'Confirm Import'}
                      </button>
                    </div>
                  </div>
                )}

                {importStage === 'importing' && (
                  <div className="import-step importing-step">
                    <div className="spinner" />
                    <p>Importing curriculum...</p>
                  </div>
                )}

                {importStage === 'done' && (
                  <div className="import-step done-step">
                    <CheckCircle size={48} color="#10B981" />
                    <h4>Import Complete!</h4>
                    <p>Your curriculum has been imported successfully.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSectionModal && (
        <div className="modal-overlay" onClick={() => setShowSectionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSection ? 'Edit Section' : 'New Section'}</h3>
              <button onClick={() => setShowSectionModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSectionSubmit}>
              <input type="hidden" value={sectionForm.planId || selectedPlan?.id} onChange={e => setSectionForm({...sectionForm, planId: e.target.value})} />
              <div className="form-group">
                <label>Title *</label>
                <input type="text" value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={sectionForm.description} onChange={e => setSectionForm({...sectionForm, description: e.target.value})} rows={2} />
              </div>
              <div className="form-group">
                <label>Order Index</label>
                <input type="number" value={sectionForm.orderIndex} onChange={e => setSectionForm({...sectionForm, orderIndex: Number(e.target.value)})} min="0" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowSectionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSection ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubsectionModal && (
        <div className="modal-overlay" onClick={() => setShowSubsectionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSubsection ? 'Edit Subsection' : 'New Subsection'}</h3>
              <button onClick={() => setShowSubsectionModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubsectionSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" value={subsectionForm.title} onChange={e => setSubsectionForm({...subsectionForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={subsectionForm.description} onChange={e => setSubsectionForm({...subsectionForm, description: e.target.value})} rows={2} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Section ID *</label>
                  <input type="text" value={subsectionForm.sectionId} onChange={e => setSubsectionForm({...subsectionForm, sectionId: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Order Index</label>
                  <input type="number" value={subsectionForm.orderIndex} onChange={e => setSubsectionForm({...subsectionForm, orderIndex: Number(e.target.value)})} min="0" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowSubsectionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSubsection ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTopicModal && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTopic ? 'Edit Topic' : 'New Topic'}</h3>
              <button onClick={() => setShowTopicModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleTopicSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" value={topicForm.title} onChange={e => setTopicForm({...topicForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={topicForm.description} onChange={e => setTopicForm({...topicForm, description: e.target.value})} rows={2} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subsection ID *</label>
                  <input type="text" value={topicForm.subsectionId} onChange={e => setTopicForm({...topicForm, subsectionId: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Order Index</label>
                  <input type="number" value={topicForm.orderIndex} onChange={e => setTopicForm({...topicForm, orderIndex: Number(e.target.value)})} min="0" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowTopicModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTopic ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubtopicModal && (
        <div className="modal-overlay" onClick={() => setShowSubtopicModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSubtopic ? 'Edit Subtopic' : 'New Subtopic'}</h3>
              <button onClick={() => setShowSubtopicModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubtopicSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" value={subtopicForm.title} onChange={e => setSubtopicForm({...subtopicForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={subtopicForm.description} onChange={e => setSubtopicForm({...subtopicForm, description: e.target.value})} rows={2} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Topic ID *</label>
                  <input type="text" value={subtopicForm.topicId} onChange={e => setSubtopicForm({...subtopicForm, topicId: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Order Index</label>
                  <input type="number" value={subtopicForm.orderIndex} onChange={e => setSubtopicForm({...subtopicForm, orderIndex: Number(e.target.value)})} min="0" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowSubtopicModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSubtopic ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}