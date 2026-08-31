import { Button, Card } from '@heroui/react';

import {
  AddRuleIcon,
  RuleIcon,
  ScheduledIcon,
} from '@/components/automations/automation-icons';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationWelcomeProps {
  onCreate: () => void;
}

/** Explains the supported rule models before the user opens the editor. */
export function AutomationWelcome({
  onCreate,
}: AutomationWelcomeProps): React.JSX.Element {
  const { t } = useI18n();

  return (
    <Card className="automation-welcome" variant="default">
      <Card.Header>
        <p className="automation-editor-kicker">
          {t('automation.guideKicker')}
        </p>
        <Card.Title>{t('automation.guideTitle')}</Card.Title>
        <Card.Description>{t('automation.guideDescription')}</Card.Description>
      </Card.Header>
      <Card.Content className="automation-guide-options">
        <article>
          <span className="automation-guide-icon">
            <RuleIcon className="size-5" />
          </span>
          <div>
            <h3>{t('automation.workflowRules')}</h3>
            <p>{t('automation.workflowGuide')}</p>
          </div>
        </article>
        <article>
          <span className="automation-guide-icon">
            <ScheduledIcon className="size-5" />
          </span>
          <div>
            <h3>{t('automation.scheduledTasks')}</h3>
            <p>{t('automation.scheduledGuide')}</p>
          </div>
        </article>
      </Card.Content>
      <Card.Footer>
        <Button onPress={onCreate}>
          <AddRuleIcon className="size-4" />
          {t('automation.newRule')}
        </Button>
      </Card.Footer>
    </Card>
  );
}
