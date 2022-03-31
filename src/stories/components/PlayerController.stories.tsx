import { ComponentStory, ComponentMeta } from '@storybook/react';
import PlayerController from 'components/playerController/PlayerController';
import { RecoilRoot } from 'recoil';
import { musicInfosFixture } from 'refs/fixture';
export default {
    title: 'components/PlayerController',
    component: PlayerController,
    argTypes: {
        goNext: { action: 'clicked' }, goPrev: { action: 'clicked' }
        , togglePlayState: { action: 'clicked' }
        , togglePlayerVisiblity: { action: 'clicked' }
    },
} as ComponentMeta<typeof PlayerController>;

const Template: ComponentStory<typeof PlayerController> = (args) => <RecoilRoot><PlayerController {...args} /></RecoilRoot>;

export const Inited = Template.bind({});
Inited.args = {
    playerVisiblity: false,
    musicInfo: musicInfosFixture[0],
    isPlaying: false
};

export const Detail = Template.bind({});
Detail.args = {
    playerVisiblity: true,
    musicInfo: musicInfosFixture[0],
    isPlaying: true
};