import Taro from '@tarojs/taro'
import { Button, Image, Text, View } from '@tarojs/components'
import React, { useState } from 'react'
import './solve.scss'

export default function SolvePage() {
  const [imagePath, setImagePath] = useState('')
  const [isAnalysing, setIsAnalysing] = useState(false)

  async function chooseQuestionImage() {
    try {
      const result = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      const path = result.tempFilePaths[0]
      setImagePath(path)
      setIsAnalysing(true)
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/confirm/confirm' })
      }, 700)
    } catch (error) {
      // 用户取消选择图片时不提示错误。
    }
  }

  return (
    <View className='solve-page'>
      <View className='intro-card'>
        <Text className='card-kicker'>单题识别 · 本地体验</Text>
        <Text className='card-title'>拍清楚题目，接下来的步骤交给我。</Text>
        <Text className='card-copy'>请尽量只保留一道题，避免姓名、学校和考号出现在照片中。</Text>
      </View>

      <View className='upload-box' onClick={chooseQuestionImage}>
        {imagePath ? (
          <Image className='question-preview' mode='aspectFit' src={imagePath} />
        ) : (
          <>
            <Text className='camera-mark'>▣</Text>
            <Text className='upload-title'>拍照或从相册选择题目</Text>
            <Text className='upload-copy'>支持清晰的数学题照片</Text>
          </>
        )}
      </View>

      <Button className='upload-button' loading={isAnalysing} onClick={chooseQuestionImage}>
        {isAnalysing ? '正在识别题目…' : '选择题目图片'}
      </Button>
      <Text className='privacy-note'>图片仅用于本次题目识别；接入正式服务前将提供删除入口。</Text>
    </View>
  )
}
