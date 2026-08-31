import Taro from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import React, { useState } from 'react'
import './solution.scss'

const steps = [
  ['观察结构', '方程 x² - 5x + 6 = 0 中，常数项 6 可以分解为 2 × 3，而 2 + 3 = 5。'],
  ['因式分解', '(x - 2)(x - 3) = 0。'],
  ['分别求根', 'x - 2 = 0 或 x - 3 = 0，因此 x = 2 或 x = 3。']
]

export default function SolutionPage() {
  const [tab, setTab] = useState('answer')

  function goPractice() {
    Taro.navigateTo({ url: '/pages/practice/practice' })
  }

  return (
    <View className='solution-page'>
      <View className='question-summary'>
        <Text className='summary-label'>题目</Text>
        <Text className='summary-question'>解方程：x² - 5x + 6 = 0。</Text>
        <Text className='knowledge-tag'>一元二次方程 · 因式分解法</Text>
      </View>

      <View className='tabs'>
        <Text className={tab === 'answer' ? 'tab active' : 'tab'} onClick={() => setTab('answer')}>答案</Text>
        <Text className={tab === 'analysis' ? 'tab active' : 'tab'} onClick={() => setTab('analysis')}>逐步解析</Text>
        <Text className={tab === 'tip' ? 'tab active' : 'tab'} onClick={() => setTab('tip')}>易错点</Text>
      </View>

      {tab === 'answer' && (
        <View className='answer-card'>
          <Text className='answer-label'>最终答案</Text>
          <Text className='answer-text'>x₁ = 2，x₂ = 3</Text>
          <Text className='latex-source'>LaTeX：x_1 = 2, x_2 = 3</Text>
        </View>
      )}

      {tab === 'analysis' && (
        <View className='analysis-list'>
          {steps.map((step, index) => (
            <View className='step-card' key={step[0]}>
              <Text className='step-number'>{index + 1}</Text>
              <View className='step-content'>
                <Text className='step-title'>{step[0]}</Text>
                <Text className='step-copy'>{step[1]}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {tab === 'tip' && (
        <View className='tip-card'>
          <Text className='tip-title'>别急着套公式</Text>
          <Text className='tip-copy'>当二次项系数为 1，且常数项较小，可以先尝试寻找两个数：它们的积等于常数项，和等于一次项系数的相反数。</Text>
        </View>
      )}

      <Button className='practice-button' onClick={goPractice}>我想再练一道</Button>
      <Text className='feedback-link'>这道题的解析是否有帮助？</Text>
    </View>
  )
}
