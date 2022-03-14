
import { ComponentStory, ComponentMeta } from '@storybook/react';
import SearchBar from 'components/SearchBar';
import { RecoilRoot } from 'recoil';

export default {
    title: 'components/SearchBar',
    component: SearchBar,
    argTypes: { search: { action: 'clicked' } },
} as ComponentMeta<typeof SearchBar>;

const Template: ComponentStory<typeof SearchBar> = (args) => <RecoilRoot><SearchBar {...args} /></RecoilRoot>;

export const Inited = Template.bind({});
Inited.args = {
};
