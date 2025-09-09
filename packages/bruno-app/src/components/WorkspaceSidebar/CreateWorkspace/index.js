import React, { useRef, useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { createWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { validateName, validateNameError } from 'utils/common/regex';
import { multiLineMsg } from 'utils/common/index';
import { formatIpcError } from 'utils/common/error';

const CreateWorkspace = ({ onClose }) => {
  const inputRef = useRef();
  const dispatch = useDispatch();
  const [isEditing, toggleEditing] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      workspaceName: '',
      workspaceLocation: ''
    },
    validationSchema: Yup.object({
      workspaceName: Yup.string()
        .min(1, 'must be at least 1 character')
        .max(255, 'must be 255 characters or less')
        .required('workspace name is required'),
      workspaceLocation: Yup.string().min(1, 'location is required').required('location is required')
    }),
    onSubmit: (values) => {
      // Use workspace name as folder name (sanitized in the backend)
      dispatch(createWorkspaceAction(values.workspaceName, values.workspaceName, values.workspaceLocation))
        .then(() => {
          toast.success('Workspace created!');
          onClose();
        })
        .catch((e) => toast.error(multiLineMsg('An error occurred while creating the workspace', formatIpcError(e))));
    }
  });

  const browse = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        // When the user closes the dialog without selecting anything dirPath will be false
        if (typeof dirPath === 'string') {
          formik.setFieldValue('workspaceLocation', dirPath);
        }
      })
      .catch((error) => {
        formik.setFieldValue('workspaceLocation', '');
        console.error(error);
      });
  };

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const onSubmit = () => formik.handleSubmit();

  return (
    <Modal size="sm" title="Create Workspace" confirmText="Create" handleConfirm={onSubmit} handleCancel={onClose}>
      <form className="bruno-form" onSubmit={formik.handleSubmit}>
        <div>
          <label htmlFor="workspaceName" className="block font-semibold">
            Workspace Name
          </label>
          <input
            id="workspace-name"
            type="text"
            name="workspaceName"
            ref={inputRef}
            className="block textbox mt-2 w-full"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={formik.handleChange}
            value={formik.values.workspaceName || ''}
          />
          {formik.touched.workspaceName && formik.errors.workspaceName ? (
            <div className="text-red-500">{formik.errors.workspaceName}</div>
          ) : null}
        </div>

        <div className="mt-3">
          <label htmlFor="workspaceLocation" className="block font-semibold">
            Location
          </label>
          <div className="flex mt-2">
            <input
              id="workspace-location"
              type="text"
              name="workspaceLocation"
              readOnly={true}
              className="block textbox w-full bg-gray-50"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={formik.values.workspaceLocation || ''}
            />
            <button
              type="button"
              className="btn btn-sm btn-secondary ml-2"
              onClick={browse}
            >
              Browse
            </button>
          </div>
          {formik.touched.workspaceLocation && formik.errors.workspaceLocation ? (
            <div className="text-red-500">{formik.errors.workspaceLocation}</div>
          ) : null}
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkspace; 