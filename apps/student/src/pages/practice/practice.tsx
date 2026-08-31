import Taro from '@tarojs/taro'
import { Button, Input, Text, View } from '@tarojs/components'
import React, { useState } from 'react'
import './practice.scss'

export default function PracticePage() {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState('')

  function checkAnswer() {
    const normalized = answer.replace(/\s/g, '')
    if (!normalized) {
      Taro.showToast({ title: '先写下你的答案', icon: 'none' })
      return
    }
    const isCorrect = normalized.includes('1') && normalized.includes('4')
    setResult(isCorrect ? 'correct' : 'review')
  }

  function backHome() {
    Taro.reLaunch({ url: '/pages/index/index' })
  }

  return (
    <View className='practice-page'>
      <View className='practice-header'>
        <Text className='header-label'>针对性练习</Text>
        <Text className='header-title'>再做一题，看看刚才的思路是否真的掌握。</Text>
        <Text className='header-tag'>一元二次方程 · 因式分解法</Text>
      </View>

      <View className='exercise-card'>
        <Text className='exercise-number'>练习 1</Text>
        <Text className='exercise-question'>解方程：x² - 5x + 4 = 0。</Text>
        <Text className='hint'>提示：寻找两个数，它们的积是 4，和是 5。</Text>
      </View>

      {!result && (
        <View className='answer-area'>
          <Text className='input-label'>写下你的答案</Text>
          <Input className='answer-input' placeholder='例如：x₁ = 1，x₂ = 4' value={answer} onInput={(event) => setAnswer(event.detail.value)} />
          <Button className='check-button' onClick={checkAnswer}>提交并查看结果</Button>
        </View>
      )}

      {result === 'correct' && (
        <View className='result-card correct'>
          <Text className='result-mark'>✓</Text>
          <Text className='result-title'>做对了，思路已经掌握！</Text>
          <Text className='result-copy'>因为 x² - 5x + 4 = (x - 1)(x - 4)，所以 x = 1 或 x = 4。</Text>
          <Button className='home-button' onClick={backHome}>记录学习成果</Button>
        </View>
      )}

      {result === 'review' && (
        <View className='result-card review'>
          <Text className='result-mark'>?</Text>
          <Text className='result-title'>再回顾一下因式分解</Text>
          <Text className='result-copy'>先找积为 4、和为 5 的两个数：1 和 4。因此 x² - 5x + 4 = (x - 1)(x - 4)。</Text>
          <Button className='retry-button' onClick={() => setResult('')}>再试一次</Button>
        </View>
      )}
    </View>
  )
}
