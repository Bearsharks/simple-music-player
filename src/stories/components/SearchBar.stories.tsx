
import { ComponentStory, ComponentMeta } from '@storybook/react';
import SearchBar from 'features/search/ui/SearchBar';
import { RecoilRoot } from 'recoil';

export default {
    title: 'features/search/ui/SearchBar',
    component: SearchBar,
    argTypes: { search: { action: 'clicked' } },
} as ComponentMeta<typeof SearchBar>;

const Template: ComponentStory<typeof SearchBar> = (args) => <RecoilRoot><SearchBar {...args} /></RecoilRoot>;

export const Shirinked = Template.bind({});
Shirinked.args = {
    initialExpand: false
};

export const Expanded = Template.bind({});
Expanded.args = {
    initialExpand: true
};
