import { useMemo } from 'react';

export const useUserPermissions = (currentUserRole?: string) => 
  useMemo(() => {
    const isBot = currentUserRole?.includes('bot_');
    const isPrincipal = currentUserRole === 'Hieu_truong';
    const isVicePrincipal = currentUserRole?.includes('Pho_hieu_truong');
    const isThamDinh = currentUserRole?.includes('tham_dinh_');
    const isViewer = isPrincipal || isVicePrincipal || isThamDinh;

    const canEditThamDinhScore = (checkItem?: any) => {
      if (!currentUserRole || isBot) return false;
      
      if (isPrincipal) {
        if (!checkItem?.hasRole || checkItem.hasRole.length === 0) return true;
        return checkItem.hasRole.includes(currentUserRole);
      }
      
      if (isVicePrincipal) {
        if (!checkItem?.hasRole || checkItem.hasRole.length === 0) return true;
        return checkItem.hasRole.includes(currentUserRole);
      }
      
      if (isThamDinh) {
        if (!checkItem?.hasRole || checkItem.hasRole.length === 0) return false;
        return checkItem.hasRole.includes(currentUserRole);
      }
      
      return false;
    };

    const canEditHieuTruongScore = (checkItem?: any) => {
      if (!currentUserRole || isBot) return false;
      
      if (!isPrincipal) return false;
      
      if (!checkItem?.hasRole || checkItem.hasRole.length === 0) return true;
      
      return checkItem.hasRole.includes(currentUserRole);
    };

    return {
      canEditSelfScore: isBot,
      canEditPrincipalScore: (itemParam?: any) => canEditThamDinhScore(itemParam),
      canEditHieuTruongScore: (itemParam?: any) => canEditHieuTruongScore(itemParam),
      canEditJustification: isBot,
      canUploadEvidence: isBot,
      isBot,
      isPrincipal,
      isVicePrincipal,
      isThamDinh,
      isViewer
    };
  }, [currentUserRole]);