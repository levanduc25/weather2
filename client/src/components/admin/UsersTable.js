import React from 'react';
import styled from 'styled-components';
import { FiEye, FiTrash2, FiSlash, FiCheckCircle, FiMoreHorizontal } from 'react-icons/fi';

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  th, td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  th {
    background: var(--bg-color);
    color: var(--muted-color);
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    
    &:first-child {
      border-top-left-radius: 12px;
    }
    &:last-child {
      border-top-right-radius: 12px;
    }
  }

  tbody tr {
    transition: background-color 0.2s;
    
    &:hover {
      background-color: var(--hover-bg);
    }
    
    &:last-child td {
      border-bottom: none;
    }
  }

  td {
    color: var(--text-color);
    font-size: 0.95rem;
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--card-bg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .details {
    display: flex;
    flex-direction: column;
    
    .name {
      font-weight: 600;
      color: var(--text-color);
    }
    
    .username {
      font-size: 0.85rem;
      color: var(--muted-color);
    }
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  
  background: ${props => props.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${props => props.status === 'active' ? '#10b981' : '#ef4444'};
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  color: var(--muted-color);
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--primary-color);
    background: var(--bg-color);
  }
  
  &.delete:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const ActionsGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);

  button {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--card-bg);
    color: var(--text-color);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  span {
    color: var(--muted-color);
    font-size: 0.9rem;
    font-weight: 500;
  }
`;

export default function UsersTable({ users, loading, page, perPage, total, onPageChange, onView, onDelete, onBanUnban }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (loading) return null;

  return (
    <div>
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>
                  <UserInfo>
                    <Avatar src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName || u.username}&background=random`} alt="avatar" />
                    <div className="details">
                      <span className="name">{u.fullName || u.username || 'User'}</span>
                      <span className="username">@{u.username}</span>
                    </div>
                  </UserInfo>
                </td>
                <td>{u.email}</td>
                <td>
                  <span style={{
                    textTransform: 'capitalize',
                    fontWeight: 500,
                    color: u.role === 'admin' ? 'var(--primary-color)' : 'inherit'
                  }}>
                    {u.role || 'user'}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <Badge status={u.banned ? 'banned' : 'active'}>
                    {u.banned ? <FiSlash size={14} /> : <FiCheckCircle size={14} />}
                    {u.banned ? 'Banned' : 'Active'}
                  </Badge>
                </td>
                <td>
                  <ActionsGroup>
                    <ActionButton onClick={() => onView(u)} title="View Details">
                      <FiEye />
                    </ActionButton>
                    <ActionButton
                      onClick={() => onBanUnban(u._id, u.banned ? 'unban' : 'ban')}
                      title={u.banned ? 'Unban User' : 'Ban User'}
                    >
                      {u.banned ? <FiCheckCircle /> : <FiSlash />}
                    </ActionButton>
                    <ActionButton
                      className="delete"
                      onClick={() => onDelete(u._id)}
                      title="Delete User"
                    >
                      <FiTrash2 />
                    </ActionButton>
                  </ActionsGroup>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrapper>

      <Pagination>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
          Next
        </button>
      </Pagination>
    </div>
  );
}
