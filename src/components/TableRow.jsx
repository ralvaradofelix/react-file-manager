import React from 'react'
import PropTypes from 'prop-types'

import { useMutation } from '@apollo/react-hooks'
import { Menu, Item, MenuProvider } from 'react-contexify'

import { useToasts } from 'react-toast-notifications'

import Modal from '../components/Modal'

// Queries
import GET_FOLDER from '../queries/getFolder'
import DELETE_FOLDER from '../queries/deleteFolder'
import DELETE_FILE from '../queries/deleteFile'
import RENAME_FILE from '../queries/renameFile'
import RENAME_FOLDER from '../queries/renameFolder'

// Helper Functions
import convertFileSize from '../utils/convertFileSize'
import { TrashIcon, InfoIcon } from '../assets/Icon'

const TableRow = ({
	showHidePreview,
	name,
	type,
	size,
	path,
	createdAt,
	setFolderPath,
}) => {
	const [isCreateModalVisible, setCreateModalVisibility] = React.useState({
		folder: false,
		file: false,
	})
	const [folderName, setFolderName] = React.useState('')
	const [fileName, setFileName] = React.useState('')
	const refetchOptions = {
		query: GET_FOLDER,
		variables: {
			path: path
				.split('/')
				.slice(0, -1)
				.join('/'),
		},
	}

	const { addToast } = useToasts()
	const [deleteFolder] = useMutation(DELETE_FOLDER, {
		onCompleted: () => {
			addToast('Folder deleted successfully!', {
				appearance: 'warning',
				autoDismiss: true,
			})
		},
		refetchQueries: [refetchOptions],
	})
	const [deleteFile] = useMutation(DELETE_FILE, {
		onCompleted: () => {
			addToast('File deleted successfully!', {
				appearance: 'warning',
				autoDismiss: true,
			})
		},
		refetchQueries: [refetchOptions],
	})
	const [renameFile] = useMutation(RENAME_FILE, {
		onCompleted: () => {
			addToast('File renamed successfully!', {
				appearance: 'success',
				autoDismiss: true,
			})
		},
		refetchQueries: [refetchOptions],
	})
	const [renameFolder] = useMutation(RENAME_FOLDER, {
		onCompleted: () => {
			addToast('Folder renamed successfully!', {
				appearance: 'success',
				autoDismiss: true,
			})
		},
		refetchQueries: [refetchOptions],
	})
	const openFile = () => {}
	const openFolder = () => setFolderPath(path)

	let clickCount = 0
	let singleClickTimer
	const singleClick = () => {
		showHidePreview({
			name,
			type,
			size,
			showHidePreview,
		})
	}
	const handleDoubleClick = () =>
		type === 'file' ? openFile() : openFolder()
	const handleClicks = () => {
		clickCount++
		if (clickCount === 1) {
			singleClickTimer = setTimeout(function() {
				clickCount = 0
				singleClick()
			}, 300)
		} else if (clickCount === 2) {
			clearTimeout(singleClickTimer)
			clickCount = 0
			handleDoubleClick()
		}
	}

	const Delete = (
		<button
			onClick={() => {
				if (type === 'folder') {
					return deleteFolder({
						variables: {
							path,
						},
					})
				}
				return deleteFile({
					variables: {
						path,
					},
				})
			}}
		>
			<TrashIcon />
		</button>
	)
	const Preview = (
		<button
			onClick={() =>
				showHidePreview({ name, type, size, showHidePreview })
			}
		>
			<InfoIcon />
		</button>
	)
	const CreatePopup = (
		<Modal>
			<Modal.Header>
				{isCreateModalVisible.file ? 'Rename File' : 'Rename Folder'}
			</Modal.Header>
			<Modal.Body>
				<label htmlFor="rename__folder__input">
					{isCreateModalVisible.file ? 'File Name' : 'Folder Name'}
				</label>
				<input
					type="text"
					name="createFolder"
					id="rename__folder__input"
					value={isCreateModalVisible.file ? fileName : folderName}
					placeholder={
						isCreateModalVisible.file
							? 'Enter a file name'
							: 'Enter a folder name'
					}
					onChange={e =>
						isCreateModalVisible.file
							? setFileName(e.target.value)
							: setFolderName(e.target.value)
					}
				/>
			</Modal.Body>
			<Modal.Footer>
				<button
					onClick={() => {
						if (isCreateModalVisible.folder) {
							renameFolder({
								variables: {
									oldPath: path,
									newPath: `${path
										.split('/')
										.slice(0, -1)
										.join('/')}/${folderName}`,
								},
							})
						} else {
							renameFile({
								variables: {
									oldPath: path,
									newPath: `${path
										.split('/')
										.slice(0, -1)
										.join('/')}/${fileName}.json`,
								},
							})
						}
						setCreateModalVisibility({
							folder: false,
							file: false,
						})
					}}
				>
					{isCreateModalVisible.file
						? 'Rename File'
						: 'Rename Folder'}
				</button>
				<button
					onClick={() =>
						setCreateModalVisibility({
							folder: false,
							file: false,
						})
					}
				>
					Cancel
				</button>
			</Modal.Footer>
		</Modal>
	)
	const generateId = `table__row__menu${Math.random()}`
	const TableRowMenu = () => (
		<Menu id={generateId}>
			{type === 'file' ? (
				<Item onClick={() => openFile()}>Open File</Item>
			) : (
				<Item onClick={() => openFolder()}>Open Folder</Item>
			)}
			<Item
				onClick={() => {
					if (type === 'file') {
						setCreateModalVisibility({
							file: !isCreateModalVisible.file,
						})
						return
					}
					setCreateModalVisibility({
						folder: !isCreateModalVisible.folder,
					})
				}}
			>
				Rename {type === 'file' ? 'file' : 'folder'}
			</Item>

			<Item
				onClick={() => {
					if (type === 'file') {
						deleteFile({
							variables: {
								path,
							},
						})
						return
					}
					return deleteFolder({
						variables: {
							path,
						},
					})
				}}
			>
				Delete {type === 'file' ? 'file' : 'folder'}
			</Item>
		</Menu>
	)

	return (
		<React.Fragment>
			<MenuProvider id={generateId}>
				{isCreateModalVisible.folder && CreatePopup}
				{isCreateModalVisible.file && CreatePopup}
				<div className="table__row">
					<div
						className="item__name"
						onClick={() => handleClicks()}
						title={name}
					>
						{name.length > 20 ? name.slice(0, 20) + '...' : name}
					</div>
					<div className="item__date">
						{new Intl.DateTimeFormat('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric',
							hour: 'numeric',
							minute: 'numeric',
						}).format(createdAt)}
					</div>
					<div className="item__type">{type}</div>
					<div className="item__size">
						{size && `${convertFileSize(size)}`}
					</div>
					<div className="item__options">
						{Preview}
						{path.split('/').length > 3 && Delete}
					</div>
				</div>
			</MenuProvider>
			<TableRowMenu />
		</React.Fragment>
	)
}

TableRow.propTypes = {
	name: PropTypes.string,
	size: PropTypes.number,
	type: PropTypes.string,
	showHidePreview: PropTypes.func,
}

export default TableRow
