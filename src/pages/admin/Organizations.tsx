import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useToast } from '../../store/useToast';
import { ApiError } from '../../api/client';
import { useOrganizations, useOrganizationQrCode, useCreateOrganization } from '../../api/hooks/useOrganizations';
import Header from '../../components/layout/Header';
import { Building2, Plus, X, QrCode, Copy, Check, Download, ExternalLink, Loader2 } from 'lucide-react';

export default function AdminOrganizations() {
  const { t } = useTranslation();
  const addToast = useToast((s) => s.addToast);
  const { data, isLoading, isError, refetch } = useOrganizations();
  const createMutation = useCreateOrganization();
  const [showCreate, setShowCreate] = useState(false);
  const [showQr, setShowQr] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', adminName: '', adminEmail: '', adminPassword: '' });
  const [formError, setFormError] = useState('');

  const organizations = data ?? [];
  const qrQuery = useOrganizationQrCode(showQr);

  const validateForm = (): string | null => {
    if (!form.name.trim()) return t('organizations.validation.name_required');
    if (!form.adminName.trim()) return t('organizations.validation.admin_name_required');
    if (!form.adminEmail.trim()) return t('organizations.validation.admin_email_required');
    if (!form.adminPassword) return t('organizations.validation.admin_password_required');
    if (form.adminPassword.length < 8) return t('organizations.validation.admin_password_length');
    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(form.adminPassword)) return t('organizations.validation.admin_password_pattern');
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: form.name.trim(),
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword,
      });
      setForm({ name: '', adminName: '', adminEmail: '', adminPassword: '' });
      setShowCreate(false);
      addToast(t('organizations.created'), 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.detail || err.message);
      } else {
        setFormError(t('error.network'));
      }
    }
  };

  const copyUrl = async (orgId: string) => {
    const url = `${window.location.origin}/org/${orgId}/menu`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(orgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const getQrSrc = (orgId: string, menuUrl: string) =>
    showQr === orgId && qrQuery.data?.qrCodeUrl
      ? qrQuery.data.qrCodeUrl
      : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(menuUrl)}`;

  const downloadQr = async (orgId: string, orgName: string) => {
    const menuUrl = `${window.location.origin}/org/${orgId}/menu`;
    const qrSrc = getQrSrc(orgId, menuUrl);
    try {
      const res = await fetch(qrSrc);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${orgName.replace(/\s+/g, '_')}_qr.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header title="Super Admin" subtitle={t('organizations.subtitle')} showUser showSidebarButton={false} />

      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{t('organizations.title')}</h2>
            <p className="text-sm text-text-secondary">{organizations.length} {t('organizations.subtitle')}</p>
          </div>
          <button
            onClick={() => { setFormError(''); setShowCreate(true); }}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('organizations.new_org')}
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white dark:bg-surface rounded-2xl border border-border p-12 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-sm text-text-secondary">...</p>
          </div>
        ) : isError ? (
          <div className="bg-white dark:bg-surface rounded-2xl border border-border p-12 text-center">
            <p className="text-text-secondary mb-4">{t('error.unexpected')}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('error.retry')}
            </button>
          </div>
        ) : organizations.length === 0 ? (
          <div className="bg-white dark:bg-surface rounded-2xl border border-border p-12 text-center">
            <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-text-secondary">{t('organizations.no_orgs')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {organizations.map((org) => {
              const menuUrl = `${window.location.origin}/org/${org.id}/menu`;
              return (
                <div key={org.id} className="bg-white dark:bg-surface rounded-2xl border border-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-text-primary mb-1">{org.name}</h3>
                      <p className="text-sm text-text-secondary mb-3">{org.adminName} — {org.adminEmail}</p>

                      <div className="flex items-center gap-2 p-3 bg-surface-secondary rounded-xl">
                        <span className="text-xs text-text-muted flex-shrink-0">{t('organizations.menu_link')}:</span>
                        <code className="text-sm text-text-primary truncate flex-1">{menuUrl}</code>
                        <button
                          onClick={() => copyUrl(org.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-surface border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                        >
                          {copiedId === org.id ? (
                            <><Check className="w-3.5 h-3.5 text-success-500" /> {t('organizations.copied')}</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> {t('organizations.copy_url')}</>
                          )}
                        </button>
                        <a
                          href={menuUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-surface border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => setShowQr(showQr === org.id ? null : org.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors flex-shrink-0 ${
                            showQr === org.id
                              ? 'bg-primary-50 border-primary-200 text-primary-700'
                              : 'bg-white dark:bg-surface border-border text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          {t('organizations.qr_code')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {showQr === org.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex flex-col items-center gap-3">
                        {qrQuery.isLoading && !qrQuery.data ? (
                          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                        ) : (
                          <img
                            src={getQrSrc(org.id, menuUrl)}
                            alt={`QR ${org.name}`}
                            className="rounded-xl border border-border"
                            style={{ width: 200, height: 200 }}
                          />
                        )}
                        <button
                          onClick={() => downloadQr(org.id, org.name)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {t('organizations.download_qr')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-text-primary">{t('organizations.new_org')}</h3>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-surface-secondary transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('organizations.org_name')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-text-primary"
                    placeholder={t('organizations.org_name_placeholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('organizations.admin_name')}</label>
                  <input
                    type="text"
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-text-primary"
                    placeholder={t('organizations.admin_name_placeholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('organizations.admin_email')}</label>
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-text-primary"
                    placeholder={t('organizations.admin_email_placeholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('organizations.admin_password')}</label>
                  <input
                    type="password"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-text-primary"
                    required
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{formError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('organizations.create')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
