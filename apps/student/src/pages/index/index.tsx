import Taro from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import React from 'react'
import './index.scss'

export default function IndexPage() {
  function goToSolve() {
    Taro.navigateTo({ url: '/pages/solve/solve' })
  }

  function goToPractice() {
    Taro.navigateTo({ url: '/pages/practice/practice' })
  }

  return (
    <View className='page'>
      <View className='hero'>
        <Text className='eyebrow'>九年级数学 · 今日学习</Text>
        <Text className='title'>从一道题开始，找到真正的学习漏洞。</Text>
        <Text className='description'>
          拍题、看懂、再练一题。让每次提问都留下进步的证据。
        </Text>
      </View>
      <Button className='primary-button' onClick={goToSolve}>拍题开始学习</Button>

      <View className='section-heading'>学习概览</View>
      <View className='progress-card'>
        <View>
          <Text className='progress-title'>一元二次方程</Text>
          <Text className='progress-copy'>已完成 3 次学习记录 · 建议再练 1 题</Text>
        </View>
        <View className='progress-score'>68<Text className='score-unit'>%</Text></View>
      </View>

      <View className='section-heading'>继续学习</View>
      <View className='action-grid'>
        <View className='action-card' onClick={goToSolve}>
          <Text className='action-icon'>⌁</Text>
          <Text className='action-title'>拍题解答</Text>
          <Text className='action-copy'>上传一道题，分步看懂</Text>
        </View>
        <View className='action-card' onClick={goToPractice}>
          <Text className='action-icon'>✦</Text>
          <Text className='action-title'>针对性练习</Text>
          <Text className='action-copy'>巩固易错知识点</Text>
        </View>
      </View>
    </View>
  )
}
