import 'github-markdown-css/github-markdown.css';
import get from 'lodash/get';
import { updateWorkspace } from 'providers/ReduxStore/slices/workspaces';
import { saveWorkspaceDocs } from 'providers/ReduxStore/slices/workspaces/actions';
import { useTheme } from 'providers/Theme';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Markdown from 'components/MarkDown';
import CodeEditor from 'components/CodeEditor';
import StyledWrapper from './StyledWrapper';
import { IconEdit, IconX, IconFileText } from '@tabler/icons';

const WorkspaceDocs = ({ workspace }) => {
  const dispatch = useDispatch();
  const { displayedTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const docs = workspace.docs || '';
  const preferences = useSelector((state) => state.app.preferences);

  const toggleViewMode = () => {
    setIsEditing((prev) => !prev);
  };

  const onEdit = (value) => {
    dispatch(
      updateWorkspace({
        uid: workspace.uid,
        docs: value
      })
    );
  };

  const handleDiscardChanges = () => {
    dispatch(
      updateWorkspace({
        uid: workspace.uid,
        docs: workspace.docs || ''
      })
    );
    toggleViewMode();
  }

  const onSave = () => {
    dispatch(saveWorkspaceDocs(workspace.uid));
    toggleViewMode();
  }

  return (
    <StyledWrapper className="h-full w-full relative flex flex-col">
      <div className='flex flex-row w-full justify-between items-center mb-4'>
        <div className='text-lg font-medium flex items-center gap-2'>
          <IconFileText size={20} strokeWidth={1.5} />
          Documentation
        </div>
        <div className='flex flex-row gap-2 items-center justify-center'>
          {isEditing ? (
            <>
              <div className="editing-mode" role="tab" onClick={handleDiscardChanges}>
                <IconX className="cursor-pointer" size={20} strokeWidth={1.5} />
              </div>
              <button type="submit" className="submit btn btn-sm btn-secondary" onClick={onSave}>
                Save
              </button>
            </>
          ) : (
            <div className="editing-mode" role="tab" onClick={toggleViewMode}>
              <IconEdit className="cursor-pointer" size={20} strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>
      {isEditing ? (
        <CodeEditor
          collection={workspace}
          theme={displayedTheme}
          value={docs}
          onEdit={onEdit}
          onSave={onSave}
          mode="application/text"
          font={get(preferences, 'font.codeFont', 'default')}
          fontSize={get(preferences, 'font.codeFontSize')}
        />
      ) : (
        <div className='h-full overflow-auto pl-1'>
          <div className='h-[1px] min-h-[500px]'>
            {
              docs?.length > 0 ?
                <Markdown collectionPath={workspace.pathname} onDoubleClick={toggleViewMode} content={docs} />
                :
                <Markdown collectionPath={workspace.pathname} onDoubleClick={toggleViewMode} content={workspaceDocumentationPlaceholder} />
            }         
          </div>
        </div>
      )}
    </StyledWrapper>
  );
};

export default WorkspaceDocs;

const workspaceDocumentationPlaceholder = `
Welcome to your workspace documentation! This space is designed to help you document your workspace effectively.

## Overview
Use this section to provide a high-level overview of your workspace. You can describe:
- The purpose of this workspace
- Key collections and their relationships
- Team members and their roles
- Project goals and milestones

## Collections
Document the collections in this workspace:
- Collection purposes and use cases
- API endpoints and functionality
- Dependencies between collections
- Testing strategies

## Best Practices
- Keep documentation up to date
- Include setup instructions
- Document environment configurations
- Add relevant links and references

## Markdown Support
This documentation supports Markdown formatting! You can use:
- **Bold** and *italic* text
- \`code blocks\` and syntax highlighting
- Tables and lists
- [Links](https://usebruno.com)
- And more!
`; 