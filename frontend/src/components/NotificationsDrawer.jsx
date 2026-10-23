import React from 'react';
import {
  BellIcon,
  ShieldAlertIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CloseIcon,
  CheckIcon,
  ClockIcon
} from './Icons';

export default function NotificationsDrawer({
  isOpen,
  onClose,
  notifications = [],
  onClearAll,
  onMarkRead,
  onSelectIncident
}) {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="notifications-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BellIcon className="w-5 h-5 text-indigo" />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Alerts & Notifications</span>
            <span className="badge-pill count">{notifications.length}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {notifications.length > 0 && (
              <button className="btn-text" onClick={onClearAll} title="Clear notifications">
                Clear all
              </button>
            )}
            <button className="icon-close-btn" onClick={onClose}>
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="drawer-content">
          {notifications.length === 0 ? (
            <div className="drawer-empty-state">
              <CheckCircleIcon className="w-10 h-10 text-emerald" />
              <p>No active alerts or unread notifications</p>
              <span>All monitored microservices are reporting healthy telemetry.</span>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notif) => {
                const isAlert = notif.type === 'ALERT' || notif.type === 'INCIDENT';
                const isWarning = notif.type === 'WARNING';
                return (
                  <div
                    key={notif.id}
                    className={`notification-card ${notif.read ? 'read' : 'unread'} ${isAlert ? 'critical' : isWarning ? 'warning' : 'info'}`}
                    onClick={() => {
                      if (notif.incidentCode && onSelectIncident) {
                        onSelectIncident(notif.incidentCode);
                        onClose();
                      }
                    }}
                  >
                    <div className="notification-icon-col">
                      {isAlert ? (
                        <ShieldAlertIcon className="w-5 h-5 text-rose" />
                      ) : isWarning ? (
                        <AlertTriangleIcon className="w-5 h-5 text-amber" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5 text-emerald" />
                      )}
                    </div>
                    <div className="notification-body">
                      <div className="notification-title-row">
                        <span className="notification-title">{notif.title}</span>
                        <span className="notification-time mono">{notif.time || 'Just now'}</span>
                      </div>
                      <p className="notification-message">{notif.message}</p>
                      {notif.incidentCode && (
                        <div className="notification-tag mono">
                          Code: {notif.incidentCode}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
