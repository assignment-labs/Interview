// src/components/interviews/StatsSummary.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const StatsSummary = ({ stats }) => {
  if (!stats) {
    return <p className="text-center text-gray-500">No stats available yet</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-xs text-blue-600 uppercase font-semibold">Total Interviews</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{stats.totalInterviews || 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-xs text-green-600 uppercase font-semibold">Completed</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{stats.completedInterviews || 0}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-xs text-purple-600 uppercase font-semibold">Practice Time</p>
          <p className="text-3xl font-bold text-purple-700 mt-1">{stats.totalHours || 0}<span className="text-sm ml-1">hrs</span></p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <p className="text-xs text-amber-600 uppercase font-semibold">Avg. Score</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">{stats.averageScore || 0}</p>
        </div>
      </div>
      
      {stats.roleCounts && Object.keys(stats.roleCounts).length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Most Practiced Roles</h3>
          <div className="space-y-2">
            {Object.entries(stats.roleCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([role, count]) => (
                <div key={role} className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(count / Math.max(...Object.values(stats.roleCounts))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 ml-2 min-w-[20px]">{count}</span>
                  <span className="text-xs text-gray-600 ml-2 truncate">{role}</span>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {stats.difficultyCounts && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Difficulty Distribution</h3>
          <div className="flex items-center">
            <div className="flex-1 grid grid-cols-3 gap-1 h-3">
              {['easy', 'medium', 'hard'].map(level => (
                <div 
                  key={level}
                  className={`rounded-sm ${
                    level === 'easy' ? 'bg-green-500' : 
                    level === 'medium' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ 
                    opacity: stats.difficultyCounts[level] ? 1 : 0.3 
                  }}
                ></div>
              ))}
            </div>
            <div className="ml-3 flex space-x-2">
              {['easy', 'medium', 'hard'].map(level => (
                <div key={level} className="flex items-center">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      level === 'easy' ? 'bg-green-500' : 
                      level === 'medium' ? 'bg-yellow-500' : 
                      'bg-red-500'
                    } mr-1`}
                  ></div>
                  <span className="text-xs text-gray-500 capitalize">{level}</span>
                  <span className="text-xs text-gray-400 ml-1">({stats.difficultyCounts[level] || 0})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h3>
          <div className="space-y-2">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="text-xs">
                {activity.type === 'interview_created' ? (
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-gray-600">Created a <strong>{activity.data.difficulty}</strong> interview for <strong>{activity.data.role}</strong></span>
                  </div>
                ) : activity.type === 'interview_completed' ? (
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-600">Completed interview with score <strong>{activity.data.score}</strong></span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                    <span className="text-gray-600">Unknown activity</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <Link 
          to="/interviews/performance" 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View detailed performance →
        </Link>
      </div>
    </>
  );
};

export default StatsSummary;