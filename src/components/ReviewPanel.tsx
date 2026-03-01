import React from 'react';
import { useReviewStore, ReviewIssue } from '../stores/review-store';
import { X, Shield, Zap, Lightbulb, Bug, Paintbrush, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import './ReviewPanel.css';

const categoryIcon = (cat: ReviewIssue['category']) => {
    switch (cat) {
        case 'security': return <Shield size={13} />;
        case 'performance': return <Zap size={13} />;
        case 'suggestion': return <Lightbulb size={13} />;
        case 'bug': return <Bug size={13} />;
        case 'style': return <Paintbrush size={13} />;
    }
};

const categoryLabel = (cat: ReviewIssue['category']) => {
    switch (cat) {
        case 'security': return 'Security';
        case 'performance': return 'Performance';
        case 'suggestion': return 'Suggestion';
        case 'bug': return 'Bug';
        case 'style': return 'Style';
    }
};

const severityColor = (sev: ReviewIssue['severity']) => {
    switch (sev) {
        case 'high': return '#f85149';
        case 'medium': return '#d29922';
        case 'low': return '#8b949e';
    }
};

export const ReviewPanel: React.FC = () => {
    const { isReviewing, reviewFileName, issues, summary, error, clearReview } = useReviewStore();

    if (!isReviewing && !reviewFileName) return null;

    const highCount = issues.filter((i) => i.severity === 'high').length;
    const medCount = issues.filter((i) => i.severity === 'medium').length;
    const lowCount = issues.filter((i) => i.severity === 'low').length;

    return (
        <div className="review-panel__overlay" onClick={clearReview}>
            <div className="review-panel" onClick={(e) => e.stopPropagation()}>
                <div className="review-panel__header">
                    <div className="review-panel__header-left">
                        <Shield size={16} />
                        <span>AI Code Review</span>
                        {reviewFileName && (
                            <span className="review-panel__file-badge">{reviewFileName}</span>
                        )}
                    </div>
                    <button className="review-panel__close" onClick={clearReview}>
                        <X size={14} />
                    </button>
                </div>

                {isReviewing ? (
                    <div className="review-panel__loading">
                        <Loader size={24} className="review-panel__spinner" />
                        <p>Reviewing <strong>{reviewFileName}</strong>…</p>
                        <p className="review-panel__loading-hint">This may take a few seconds</p>
                    </div>
                ) : error ? (
                    <div className="review-panel__error">
                        <AlertTriangle size={20} />
                        <p>{error}</p>
                        <p className="review-panel__error-hint">Make sure your API key is configured in Settings.</p>
                    </div>
                ) : (
                    <div className="review-panel__body">
                        {summary && (
                            <div className="review-panel__summary">
                                <CheckCircle size={14} />
                                <span>{summary}</span>
                            </div>
                        )}

                        <div className="review-panel__stats">
                            {highCount > 0 && (
                                <span className="review-panel__stat" style={{ color: '#f85149' }}>
                                    {highCount} high
                                </span>
                            )}
                            {medCount > 0 && (
                                <span className="review-panel__stat" style={{ color: '#d29922' }}>
                                    {medCount} medium
                                </span>
                            )}
                            {lowCount > 0 && (
                                <span className="review-panel__stat" style={{ color: '#8b949e' }}>
                                    {lowCount} low
                                </span>
                            )}
                            {issues.length === 0 && (
                                <span className="review-panel__stat" style={{ color: '#3fb950' }}>
                                    ✓ No issues found
                                </span>
                            )}
                        </div>

                        <div className="review-panel__issues">
                            {issues.map((issue, idx) => (
                                <div key={idx} className={`review-panel__issue review-panel__issue--${issue.severity}`}>
                                    <div className="review-panel__issue-header">
                                        <span className="review-panel__issue-icon" style={{ color: severityColor(issue.severity) }}>
                                            {categoryIcon(issue.category)}
                                        </span>
                                        <span className="review-panel__issue-cat">{categoryLabel(issue.category)}</span>
                                        <span className="review-panel__issue-sev" style={{ color: severityColor(issue.severity) }}>
                                            {issue.severity}
                                        </span>
                                        {issue.line && (
                                            <span className="review-panel__issue-line">Line {issue.line}</span>
                                        )}
                                    </div>
                                    <p className="review-panel__issue-msg">{issue.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
