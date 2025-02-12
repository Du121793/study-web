import React from 'react'
import styles from './ProgressBar.module.css'

const ProgressBar = ({ fileName, progress, status }) => {
  return (
    <div className={styles.progressBarContainer}>
      <div className={styles.fileName}>
        {fileName} - {status}
      </div>
      <div
        className={styles.progressBar}
        style={{ width: `${progress}%` }}></div>
      <div className={styles.progressText}>{progress.toFixed(2)}%</div>
    </div>
  )
}

export default ProgressBar
