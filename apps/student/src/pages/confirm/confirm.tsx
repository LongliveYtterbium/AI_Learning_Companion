import Taro from '@tarojs/taro'
import { Button, Text, Textarea, View } from '@tarojs/components'
import React, { useState } from 'react'
import './confirm.scss'

const questionText = '解方程：x² - 5x + 6 = 0。'

export default function ConfirmPage() {
  const [value, setValue] = useState(questionText)

  function viewSolution() {
    if (!value.trim()) {
      Taro.showToast({ title: '请补充题目内容', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: '/pages/solution/solution' })
  }

  return (
    <View className='confirm-page'>
      <View className='step-label'>第 1 步 / 共 3 步</View>
      <Text className='heading'>先确认题目，避免解错。</Text>
      <Text className='subheading'>这是本地模拟的识别结果。真实 AI 接入后，识别不清的部分会被高亮提醒。</Text>

      <View className='question-card'>
        <Text className='card-label'>识别出的题目</Text>
        <Textarea className='question-editor' value={value} onInput={(event) => setValue(event.detail.value)} />
      </View>

      <View className='confidence-card'>
        <Text className='confidence-icon'>✓</Text>
        <View>
          <Text className='confidence-title'>公式识别清晰</Text>
          <Text className='confidence-copy'>建议核对题号、条件和符号后再查看解答。</Text>
        </View>
      </View>

      <Button className='next-button' onClick={viewSolution}>确认题目，查看解答</Button>
    </View>
  )
}
