import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface UseUrlPaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  defaultStatus?: string;
}

interface UseUrlPaginationReturn {
  currentPage: number;
  pageSize: number;
  statusFilter: string;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setStatusFilter: (status: string) => void;
  updateUrl: (params: { page?: number; pageSize?: number; status?: string }) => void;
}

export const useUrlPagination = (options: UseUrlPaginationOptions = {}): UseUrlPaginationReturn => {
  const {
    defaultPage = 1,
    defaultPageSize = 10,
    defaultStatus = 'ALL'
  } = options;

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get values from URL or use defaults
  const getPageFromUrl = useCallback(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? Math.max(1, parseInt(pageParam, 10)) : defaultPage;
  }, [searchParams, defaultPage]);

  const getPageSizeFromUrl = useCallback(() => {
    const sizeParam = searchParams.get('pageSize');
    return sizeParam ? Math.max(1, parseInt(sizeParam, 10)) : defaultPageSize;
  }, [searchParams, defaultPageSize]);

  const getStatusFromUrl = useCallback(() => {
    return searchParams.get('status') || defaultStatus;
  }, [searchParams, defaultStatus]);

  // Initialize state from URL
  const [currentPage, setCurrentPageState] = useState(() => getPageFromUrl());
  const [pageSize, setPageSizeState] = useState(() => getPageSizeFromUrl());
  const [statusFilter, setStatusFilterState] = useState(() => getStatusFromUrl());

  // Update URL when parameters change
  const updateUrl = useCallback((params: { page?: number; pageSize?: number; status?: string }) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (params.page !== undefined) {
      if (params.page === defaultPage) {
        newSearchParams.delete('page');
      } else {
        newSearchParams.set('page', params.page.toString());
      }
    }

    if (params.pageSize !== undefined) {
      if (params.pageSize === defaultPageSize) {
        newSearchParams.delete('pageSize');
      } else {
        newSearchParams.set('pageSize', params.pageSize.toString());
      }
    }

    if (params.status !== undefined) {
      if (params.status === defaultStatus) {
        newSearchParams.delete('status');
      } else {
        newSearchParams.set('status', params.status);
      }
    }

    // Update URL without causing a page reload
    const newUrl = newSearchParams.toString();
    const currentPath = window.location.pathname;
    const fullUrl = newUrl ? `${currentPath}?${newUrl}` : currentPath;
    
    navigate(fullUrl, { replace: true });
  }, [searchParams, navigate, defaultPage, defaultPageSize, defaultStatus]);

  // Sync state with URL parameters when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlPage = getPageFromUrl();
    const urlPageSize = getPageSizeFromUrl();
    const urlStatus = getStatusFromUrl();

    // Only update state if URL values are different from current state
    // This prevents infinite loops
    setCurrentPageState(prev => prev !== urlPage ? urlPage : prev);
    setPageSizeState(prev => prev !== urlPageSize ? urlPageSize : prev);
    setStatusFilterState(prev => prev !== urlStatus ? urlStatus : prev);
  }, [getPageFromUrl, getPageSizeFromUrl, getStatusFromUrl]);

  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageState(page);
    updateUrl({ page });
  }, [updateUrl]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    // Reset to page 1 when changing page size
    setCurrentPageState(1);
    updateUrl({ page: 1, pageSize: size });
  }, [updateUrl]);

  const setStatusFilter = useCallback((status: string) => {
    setStatusFilterState(status);
    // Reset to page 1 when changing filter
    setCurrentPageState(1);
    updateUrl({ page: 1, status });
  }, [updateUrl]);

  return {
    currentPage,
    pageSize,
    statusFilter,
    setCurrentPage,
    setPageSize,
    setStatusFilter,
    updateUrl,
  };
};