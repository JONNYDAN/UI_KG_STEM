import { Box, Button } from '@mui/material';
import { blue } from '@mui/material/colors';

type Tab = {
  value: string;
  label: string;
};

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Tab[];
};

export function ProfileTabs({ activeTab, onTabChange, tabs }: Props) {
  return (
    <Box sx={{ mb: 2 }}>
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          variant={activeTab === tab.value ? 'contained' : 'text'}
          onClick={() => onTabChange(tab.value)}
          sx={{ mr: 2, mb: -1 , borderRadius: 1 , border: '1px solid', borderColor: blue[500] }}
        >
          {tab.label}
        </Button>
      ))}
    </Box>
  );
}