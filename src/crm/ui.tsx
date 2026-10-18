import { Dialog } from 'radix-ui';
import { X, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';

export function Panel({ title, subtitle, eyebrow, drawer = false, onClose, children }: { title: string; subtitle?: string; eyebrow?: string; drawer?: boolean; onClose: () => void; children: ReactNode }) {
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal><Dialog.Overlay className="crm-overlay" />
      <Dialog.Content className={`crm-surface crm-modal ${drawer ? 'crm-drawer' : ''}`}>
        <header className="crm-modal-head">
          {eyebrow && <p className="crm-eyebrow">{eyebrow}</p>}
          <Dialog.Title className="crm-modal-title">{title}</Dialog.Title>
          <Dialog.Description className={subtitle ? 'crm-modal-description' : 'sr-only'}>{subtitle || title}</Dialog.Description>
          <Dialog.Close asChild><Button size="icon" variant="ghost" className="crm-close" aria-label="Закрыть"><X /></Button></Dialog.Close>
        </header>
        <div className="crm-modal-body">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
export function Select({ label, value, onChange, children, id, disabled = false }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; id?: string; disabled?: boolean }) {
  return <NativeSelect id={id} aria-label={label} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>{children}</NativeSelect>;
}
export function Empty({ title = 'Ничего не найдено', text = 'Попробуйте другой запрос или измените фильтры.', children }: { title?: string; text?: string; children?: ReactNode }) {
  return <div className="crm-empty"><SearchX aria-hidden="true" /><h3>{title}</h3><p>{text}</p>{children}</div>;
}
export function Avatar({ initials, large = false }: { initials: string; large?: boolean }) { return <span className={`crm-avatar ${large ? 'large' : ''}`}>{initials}</span>; }
