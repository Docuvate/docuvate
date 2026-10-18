// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '../components/ui/Avatar';
import { Banner } from '../components/ui/Banner';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Button } from '../components/ui/Button';
import { ChatMessage } from '../components/ui/ChatMessage';
import { Checkbox } from '../components/ui/Checkbox';
import { Chip } from '../components/ui/Chip';
import { Confidence } from '../components/ui/Confidence';
import { Divider } from '../components/ui/Divider';
import { DocumentTableHeader } from '../components/ui/DocumentTableHeader';
import { DocumentTableRow } from '../components/ui/DocumentTableRow';
import { DocumentTile } from '../components/ui/DocumentTile';
import { EmptyState } from '../components/ui/EmptyState';
import { FieldValueRow } from '../components/ui/FieldValueRow';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/ui/Logo';
import { MenuItem } from '../components/ui/MenuItem';
import { Pagination } from '../components/ui/Pagination';
import { Progress } from '../components/ui/Progress';
import { Radio } from '../components/ui/Radio';
import { SearchField } from '../components/ui/SearchField';
import { SuggestionRow } from '../components/ui/SuggestionRow';
import { Tab, TabBar } from '../components/ui/Tab';
import { Textarea } from '../components/ui/Textarea';

export function DesignSystemShowcase() {
  const { t } = useTranslation();

  return (
    <div className="styles-catalog-section" data-testid="design-system-showcase">
      <h2>{t('designSystem.showcase.title')}</h2>

      <h3>{t('designSystem.showcase.brand')}</h3>
      <div className="styles-component-grid">
        <Logo type="full" />
        <Logo type="mark" />
        <Avatar initials="TT" size="lg" />
      </div>

      <h3>{t('designSystem.showcase.formField')}</h3>
      <FormField label={t('designSystem.showcase.serverUrlLabel')} help={t('designSystem.showcase.serverUrlHelp')}>
        <Input id="ds-server-url" defaultValue={t('designSystem.showcase.serverUrlValue')} />
      </FormField>

      <h3>{t('designSystem.showcase.controls')}</h3>
      <div className="styles-component-grid">
        <Checkbox label={t('designSystem.showcase.checkboxLabel')} defaultChecked />
        <Radio name="ocr" label={t('designSystem.showcase.radioLabel')} defaultChecked />
        <Progress value={62} />
        <Confidence value={88} />
      </div>

      <h3>{t('designSystem.showcase.navigation')}</h3>
      <Breadcrumb
        items={[
          { label: t('designSystem.showcase.breadcrumbSettings'), to: '/settings' },
          { label: t('designSystem.showcase.breadcrumbConnectors') },
        ]}
      />
      <SearchField />
      <TabBar>
        <Tab active>{t('designSystem.showcase.tabDetails')}</Tab>
        <Tab>{t('designSystem.showcase.tabLabels')}</Tab>
        <Tab>{t('designSystem.showcase.tabChat')}</Tab>
      </TabBar>
      <Pagination from={1} to={8} total={128} />

      <h3>{t('designSystem.showcase.dataDisplay')}</h3>
      <div className="doc-table">
        <DocumentTableHeader />
        <DocumentTableRow
          selected
          title={t('designSystem.showcase.docTitle')}
          meta={t('designSystem.showcase.docMeta')}
          correspondent={t('designSystem.showcase.docCorrespondent')}
          labels={<Chip variant="assigned" label={t('designSystem.showcase.chipRechnung')} color="#3b82f6" />}
          date={t('designSystem.showcase.docDate')}
          status={<span className="badge badge-ready">{t('designSystem.showcase.statusReady')}</span>}
        />
      </div>

      <SuggestionRow
        label={t('designSystem.showcase.suggestLabel')}
        confidencePercent={94}
        sourceLabel={t('designSystem.showcase.suggestSource')}
      />
      <FieldValueRow
        fieldName={t('designSystem.showcase.fieldName')}
        value={t('designSystem.showcase.fieldValue')}
        state="suggested"
        confidencePercent={88}
        sourceLabel={t('designSystem.showcase.fieldSource')}
      />

      <div className="styles-component-grid">
        <DocumentTile
          title={t('designSystem.showcase.tileTitle2026')}
          meta={t('designSystem.showcase.tileMeta2026')}
          selected
        />
        <DocumentTile
          title={t('designSystem.showcase.tileTitle2025')}
          meta={t('designSystem.showcase.tileMeta2025')}
          excluded
        />
      </div>

      <h3>{t('designSystem.showcase.feedback')}</h3>
      <Banner
        icon={Upload}
        title={t('designSystem.showcase.bannerTitle')}
        description={t('designSystem.showcase.bannerDescription')}
        action={
          <Button type="button" variant="primary" size="sm">
            {t('designSystem.showcase.bannerAction')}
          </Button>
        }
      />
      <EmptyState
        icon={Upload}
        title={t('designSystem.showcase.emptyTitle')}
        description={t('designSystem.showcase.emptyDescription')}
        actions={
          <>
            <Button type="button" variant="primary">
              {t('designSystem.showcase.emptyUpload')}
            </Button>
            <Button type="button" variant="secondary">
              {t('designSystem.showcase.emptyConnect')}
            </Button>
          </>
        }
      />

      <h3>{t('designSystem.showcase.chat')}</h3>
      <ChatMessage messageRole="user">{t('designSystem.showcase.chatQuestion')}</ChatMessage>
      <ChatMessage
        messageRole="assistant"
        sources={[{ label: t('designSystem.showcase.chatSource'), kind: 'page' }]}
      >
        {t('designSystem.showcase.chatAnswer')}
      </ChatMessage>

      <h3>{t('designSystem.showcase.menu')}</h3>
      <div className="styles-menu-demo">
        <MenuItem label={t('designSystem.showcase.menuRename')} shortcut="⌘R" />
        <MenuItem label={t('designSystem.showcase.menuDelete')} variant="danger" />
      </div>

      <Divider />
      <FormField label={t('designSystem.showcase.noteLabel')} help={t('designSystem.showcase.noteHelp')}>
        <Textarea id="ds-note" defaultValue={t('designSystem.showcase.noteValue')} />
      </FormField>
    </div>
  );
}
