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

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get initial values from URL or use defaults
  const getInitialPage = () => {
    const pageParam = searchParams.get('page');
    return pageParam ? Math.max(1, parseInt(pageParam, 10)) : defaultPage;
  };

  const getInitialPageSize = () => {
    const sizeParam = searchParams.get('pageSize');
    return sizeParam ? Math.max(1, parseInt(sizeParam, 10)) : defaultPageSize;
  };

  const getInitialStatus = () => {
    return searchParams.get('status') || defaultStatus;
  };

  const [currentPage, setCurrentPageState] = useState(getInitialPage);
  const [pageSize, setPageSizeState] = useState(getInitialPageSize);
  const [statusFilter, setStatusFilterState] = useState(getInitialStatus);

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

  // Sync state with URL parameters when they change
  useEffect(() => {
    const urlPage = getInitialPage();
    const urlPageSize = getInitialPageSize();
    const urlStatus = getInitialStatus();

    if (urlPage !== currentPage) {
      setCurrentPageState(urlPage);
    }
    if (urlPageSize !== pageSize) {
      setPageSizeState(urlPageSize);
    }
    if (urlStatus !== statusFilter) {
      setStatusFilterState(urlStatus);
    }
  }, [searchParams]);

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