
import { ComponentStory, ComponentMeta } from '@storybook/react';
import SearchBar from 'components/SearchBar';

export default {
    title: 'components/SearchBar',
    component: SearchBar,
    argTypes: { search: { action: 'clicked' } },
} as ComponentMeta<typeof SearchBar>;

const Template: ComponentStory<typeof SearchBar> = (args) => <SearchBar {...args} />;

export const Inited = Template.bind({});
Inited.args = {
};
