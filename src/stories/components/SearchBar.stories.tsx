
import { StoryFn, Meta } from '@storybook/react';
import SearchBar from 'features/search/ui/SearchBar';
import { Provider } from 'jotai';

export default {
    title: 'features/search/ui/SearchBar',
    component: SearchBar,
    argTypes: { search: { action: 'clicked' } },
} as Meta<typeof SearchBar>;

const Template: StoryFn<typeof SearchBar> = (args) => <Provider><SearchBar {...args} /></Provider>;

export const Shirinked = Template.bind({});
Shirinked.args = {
    initialExpand: false
};

export const Expanded = Template.bind({});
Expanded.args = {
    initialExpand: true
};
