"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { User, Mail, Phone, GraduationCap, Eye, EyeOff, CheckCircle } from "lucide-react"

import API_BASE_URL from "@/lib/api"

const avatarOptions = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=2", 
  "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=6",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=7",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=8",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=9",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=10",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=11",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=12",
  "https://api.dicebear.com/7.x/personas/svg?seed=1",
  "https://api.dicebear.com/7.x/personas/svg?seed=2",
  "https://api.dicebear.com/7.x/personas/svg?seed=3",
  "https://api.dicebear.com/7.x/personas/svg?seed=4",
  "https://api.dicebear.com/7.x/initials/svg?seed=John",
  "https://api.dicebear.com/7.x/initials/svg?seed=Jane"
]

interface PsychometricQuestion {
  id: number
  question: string
  options: string[]
  category: string
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [progress, setProgress] = useState(16)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    degree: { status: "pursuing", name: "" },
    schoolGroup: "",
    avatar: avatarOptions[0],
    additionalDetails: "",
    userType: "",
    password: "",
    hasCareerIdea: null as boolean | null,
    selectedField: "",
    psychometricAnswers: {} as Record<number, string>,
    employeeInfo: {
      currentField: "",
      wantToSwitch: null as boolean | null,
      developCurrent: null as boolean | null,
      desiredField: ""
    }
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [careerFieldInput, setCareerFieldInput] = useState("")
  const [analyzingField, setAnalyzingField] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [psychometricQuestions, setPsychometricQuestions] = useState<PsychometricQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [psychometricAnswers, setPsychometricAnswers] = useState<Record<number, string>>({})
  const [loadingTest, setLoadingTest] = useState(false)
  const [tempUserId, setTempUserId] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Remove the fetchCareerFields call since we're using AI analysis now
  }, [])

  const generatePsychometricTest = async () => {
    setLoadingTest(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-psychometric-test`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPsychometricQuestions(data.test.questions || [])
        setStep(5)
        setProgress(83)
      } else {
        completeRegistration()
      }
    } catch (error) {
      console.error('Failed to generate test:', error)
      completeRegistration()
    } finally {
      setLoadingTest(false)
    }
  }

  const handleTestAnswer = (answer: string) => {
    const newAnswers = { ...psychometricAnswers, [currentQuestionIndex]: answer }
    setPsychometricAnswers(newAnswers)
    
    if (currentQuestionIndex < psychometricQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      analyzePsychometricResults(newAnswers)
    }
  }

  const analyzePsychometricResults = async (answers: Record<number, string>) => {
    setAnalyzingField(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/analyze-psychometric-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, userInfo: formData })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalysisResult(data.results)
        setStep(6)
        setProgress(100)
      } else {
        completeRegistration()
      }
    } catch (error) {
      console.error('Failed to analyze results:', error)
      completeRegistration()
    } finally {
      setAnalyzingField(false)
    }
  }

  const analyzeEmployeeField = async (type: 'current' | 'switch') => {
    const fieldToAnalyze = type === 'current' ? formData.employeeInfo.currentField : formData.employeeInfo.desiredField
    
    if (!fieldToAnalyze.trim()) {
      setError("Please enter a field")
      return
    }

    setAnalyzingField(true)
    setError("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/analyze-employee-field`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          field: fieldToAnalyze,
          type,
          userInfo: {
            name: formData.name,
            userType: formData.userType,
            currentField: formData.employeeInfo.currentField
          }
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setAnalysisResult(data)
      setStep(6)
      setProgress(100)
    } catch (error: any) {
      console.error('Employee field analysis failed:', error)
      completeRegistration(fieldToAnalyze)
    } finally {
      setAnalyzingField(false)
    }
  }

  const analyzeCareerField = async () => {
    if (!careerFieldInput.trim()) {
      setError("Please enter a career field")
      return
    }

    setAnalyzingField(true)
    setError("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/analyze-career-field`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          careerField: careerFieldInput,
          userInfo: {
            name: formData.name,
            userType: formData.userType,
            degree: formData.degree
          }
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setAnalysisResult(data)
      setStep(6)
      setProgress(100)
    } catch (error: any) {
      console.error('AI analysis failed:', error)
      // Fallback: proceed with user input as-is
      completeRegistration(careerFieldInput)
    } finally {
      setAnalyzingField(false)
    }
  }

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/basic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      setTempUserId(data.tempUserId)
      setStep(2)
      setProgress(33)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.password) {
      setError("Please enter a password")
      return
    }
    setStep(3)
    setProgress(50)
  }

  const handleUserTypeSubmit = async (userType: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/usertype`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempUserId, userType, password: formData.password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      setFormData({...formData, userType})
      setStep(4)
      setProgress(66)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const completeRegistration = async (selectedOption?: string) => {
    setLoading(true)
    setStep(7)
    setProgress(100)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempUserId, selectedOption })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/')
    } catch (error: any) {
      setError(error.message)
      setStep(6)
      setProgress(100)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SkillFirm
              </h1>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Create Your Account</h2>
            <p className="text-gray-600">Join thousands of learners advancing their careers</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {step} of 6</span>
              <span>{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBasicSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Degree Status</Label>
                      <Select value={formData.degree.status} onValueChange={(value) => setFormData({...formData, degree: {...formData.degree, status: value}})}>
                        <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pursuing">Currently Pursuing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="degreeName" className="text-sm font-medium text-gray-700">Degree Name</Label>
                      <Input
                        id="degreeName"
                        type="text"
                        placeholder="e.g., Computer Science"
                        value={formData.degree.name}
                        onChange={(e) => setFormData({...formData, degree: {...formData.degree, name: e.target.value}})}
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolGroup" className="text-sm font-medium text-gray-700">School Group (10+2)</Label>
                    <Select value={formData.schoolGroup} onValueChange={(value) => setFormData({...formData, schoolGroup: value})}>
                      <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500">
                        <SelectValue placeholder="Select your stream" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="commerce">Commerce</SelectItem>
                        <SelectItem value="arts">Arts/Humanities</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Choose Your Avatar</Label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-h-48 overflow-y-auto">
                      {avatarOptions.map((avatar, index) => (
                        <div
                          key={index}
                          className={`cursor-pointer p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                            formData.avatar === avatar ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({...formData, avatar})}
                        >
                          <Avatar className="w-10 h-10 mx-auto">
                            <AvatarImage src={avatar} />
                            <AvatarFallback>A{index + 1}</AvatarFallback>
                          </Avatar>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="details" className="text-sm font-medium text-gray-700">Additional Details (Optional)</Label>
                    <Textarea
                      id="details"
                      placeholder="Tell us more about yourself, your interests, or goals..."
                      value={formData.additionalDetails}
                      onChange={(e) => setFormData({...formData, additionalDetails: e.target.value})}
                      className="min-h-[100px] border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? "Creating Account..." : "Continue"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Password Setup */}
          {step === 2 && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">Account Setup</CardTitle>
                <p className="text-gray-600 mt-2">Create a secure password for your account</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Continue
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 3: User Type Selection */}
          {step === 3 && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">User Type</CardTitle>
                <p className="text-gray-600 mt-2">Tell us about yourself</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { type: 'school', label: 'School Student', desc: 'Currently in school' },
                    { type: 'college', label: 'College Student', desc: 'Pursuing higher education' },
                    { type: 'employee', label: 'Working Professional', desc: 'Currently employed' }
                  ].map((option) => (
                    <Card 
                      key={option.type}
                      className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300"
                      onClick={() => handleUserTypeSubmit(option.type)}
                    >
                      <CardContent className="p-6 text-center">
                        <h3 className="font-semibold text-gray-800 mb-2">{option.label}</h3>
                        <p className="text-sm text-gray-600">{option.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Career Interest */}
          {step === 4 && formData.userType !== 'employee' && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">Career Interest</CardTitle>
                <p className="text-gray-600 mt-2">Do you have a specific career field in mind?</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300"
                    onClick={() => {
                      setFormData({...formData, hasCareerIdea: true})
                      setStep(5)
                      setProgress(83)
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-800 mb-2">Yes, I do!</h3>
                      <p className="text-sm text-gray-600">I have a specific career field in mind</p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300"
                    onClick={() => {
                      setFormData({...formData, hasCareerIdea: false})
                      if (formData.userType === 'school' || formData.userType === 'college') {
                        generatePsychometricTest()
                      } else {
                        completeRegistration()
                      }
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <GraduationCap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-800 mb-2">Not yet</h3>
                      <p className="text-sm text-gray-600">I'd like help exploring options</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Employee Career Options */}
          {step === 4 && formData.userType === 'employee' && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">Career Development</CardTitle>
                <p className="text-gray-600 mt-2">What would you like to focus on?</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300"
                    onClick={() => {
                      setFormData({...formData, employeeInfo: {...formData.employeeInfo, developCurrent: true}})
                      setStep(5)
                      setProgress(83)
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-800 mb-2">Develop Current Field</h3>
                      <p className="text-sm text-gray-600">Advance in my current career field</p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300"
                    onClick={() => {
                      setFormData({...formData, employeeInfo: {...formData.employeeInfo, wantToSwitch: true}})
                      setStep(5)
                      setProgress(83)
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <GraduationCap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-800 mb-2">Switch Field</h3>
                      <p className="text-sm text-gray-600">Transition to a different career field</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Career Field Input (for college students who have career ideas) */}
          {step === 5 && formData.userType === 'college' && formData.hasCareerIdea && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">Tell Us About Your Career Interest</CardTitle>
                <p className="text-gray-600 mt-2">Describe the career field or job role you're interested in</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="careerField" className="text-sm font-medium text-gray-700">
                    Career Field or Job Role
                  </Label>
                  <Textarea
                    id="careerField"
                    placeholder="e.g., Software Developer, Data Scientist, Digital Marketing, Graphic Designer, etc."
                    value={careerFieldInput}
                    onChange={(e) => setCareerFieldInput(e.target.value)}
                    className="min-h-[100px] border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={analyzingField}
                  />
                  <p className="text-xs text-gray-500">
                    Be as specific as possible. Our AI will analyze your input and provide personalized recommendations.
                  </p>
                </div>
                
                <Button 
                  onClick={analyzeCareerField}
                  disabled={analyzingField || !careerFieldInput.trim()}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {analyzingField ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing with AI...
                    </div>
                  ) : (
                    "Analyze & Continue"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Psychometric Test */}
          {step === 5 && psychometricQuestions.length > 0 && (formData.userType === 'school' || formData.userType === 'college') && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">Career Assessment</CardTitle>
                <p className="text-gray-600 mt-2">
                  Question {currentQuestionIndex + 1} of {psychometricQuestions.length}
                </p>
                <Progress value={((currentQuestionIndex + 1) / psychometricQuestions.length) * 100} className="mt-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-6">
                    {psychometricQuestions[currentQuestionIndex]?.question}
                  </h3>
                  <div className="grid gap-3">
                    {psychometricQuestions[currentQuestionIndex]?.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => handleTestAnswer(option)}
                        className="p-4 text-left hover:bg-blue-50 hover:border-blue-300"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Employee Current Field Input */}
          {step === 5 && formData.userType === 'employee' && formData.employeeInfo.developCurrent && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">Current Field Development</CardTitle>
                <p className="text-gray-600 mt-2">Tell us about your current career field</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="currentField" className="text-sm font-medium text-gray-700">
                    Your Current Career Field
                  </Label>
                  <Textarea
                    id="currentField"
                    placeholder="e.g., Software Development, Marketing, Finance, etc."
                    value={formData.employeeInfo.currentField}
                    onChange={(e) => setFormData({...formData, employeeInfo: {...formData.employeeInfo, currentField: e.target.value}})}
                    className="min-h-[100px] border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={analyzingField}
                  />
                </div>
                
                <Button 
                  onClick={() => analyzeEmployeeField('current')}
                  disabled={analyzingField || !formData.employeeInfo.currentField.trim()}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {analyzingField ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing Field...
                    </div>
                  ) : (
                    "Analyze Current Field"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Employee Desired Field Input */}
          {step === 5 && formData.userType === 'employee' && formData.employeeInfo.wantToSwitch && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">Field Transition</CardTitle>
                <p className="text-gray-600 mt-2">What field would you like to switch to?</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="desiredField" className="text-sm font-medium text-gray-700">
                    Desired Career Field
                  </Label>
                  <Textarea
                    id="desiredField"
                    placeholder="e.g., Data Science, UX Design, Product Management, etc."
                    value={formData.employeeInfo.desiredField}
                    onChange={(e) => setFormData({...formData, employeeInfo: {...formData.employeeInfo, desiredField: e.target.value}})}
                    className="min-h-[100px] border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={analyzingField}
                  />
                </div>
                
                <Button 
                  onClick={() => analyzeEmployeeField('switch')}
                  disabled={analyzingField || !formData.employeeInfo.desiredField.trim()}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {analyzingField ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing Field...
                    </div>
                  ) : (
                    "Analyze Desired Field"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Analysis Results */}
          {step === 6 && analysisResult && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800">
                  {analysisResult.suggestedFields ? 'Career Recommendations' : 
                   analysisResult.type === 'current' ? 'Current Field Analysis' :
                   analysisResult.type === 'switch' ? 'Field Transition Analysis' : 'Career Field Analysis'}
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  {analysisResult.suggestedFields ? 'Based on your personality assessment' : 
                   analysisResult.type ? 'Based on your career goals' : 'Based on AI analysis of your chosen field'}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Psychometric Results */}
                {analysisResult.suggestedFields ? (
                  <div className="space-y-4">
                    {analysisResult.personality && (
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <h3 className="font-semibold mb-2">Your Personality</h3>
                        <p className="text-gray-700">{analysisResult.personality}</p>
                      </div>
                    )}
                    
                    <h3 className="font-semibold text-gray-800">Recommended Career Fields</h3>
                    <div className="grid gap-3">
                      {analysisResult.suggestedFields.map((field: any, index: number) => (
                        <div key={index} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer" 
                             onClick={() => completeRegistration(field.field)}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{field.field}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              field.futureValue === 'High' ? 'bg-green-100 text-green-700' :
                              field.futureValue === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {field.futureValue || 'High'} Value
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{field.reason}</p>
                          <div className="text-xs text-gray-500">
                            Match: {field.suitability_score || 85}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Employee and Career Field Analysis Results */
                  <div>
                    <div className="p-4 border rounded-xl">
                      <h3 className="font-semibold text-lg mb-2">{analysisResult.analyzedField}</h3>
                      <p className="text-gray-600 mb-3">{analysisResult.marketOutlook}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          analysisResult.futureValue === 'High' ? 'bg-green-100 text-green-700' :
                          analysisResult.futureValue === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Future Value: {analysisResult.futureValue || 'Medium'}
                        </span>
                      </div>
                      
                      {/* Employee-specific content */}
                      {analysisResult.type && (
                        <div className="mb-3">
                          {analysisResult.developmentPaths && (
                            <div className="mb-2">
                              <h4 className="font-medium text-sm mb-1">Development Paths:</h4>
                              <ul className="text-sm text-gray-600 list-disc list-inside">
                                {analysisResult.developmentPaths.map((path: string, i: number) => (
                                  <li key={i}>{path}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysisResult.requiredSkills && (
                            <div className="mb-2">
                              <h4 className="font-medium text-sm mb-1">Required Skills:</h4>
                              <div className="flex flex-wrap gap-1">
                                {analysisResult.requiredSkills.map((skill: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{skill}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => completeRegistration(analysisResult.analyzedField)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        Continue with {analysisResult.analyzedField}
                      </Button>
                    </div>

                    {/* Alternative Fields */}
                    {analysisResult.alternatives && analysisResult.alternatives.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3">
                          {analysisResult.type ? 'Alternative High-Value Fields' : 'Alternative High-Value Fields'}
                        </h3>
                        <div className="grid gap-3">
                          {analysisResult.alternatives.map((alt: string, index: number) => (
                            <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" 
                                 onClick={() => completeRegistration(alt)}>
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{alt}</span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                  High Value
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 7: Final Processing */}
          {step === 7 && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Creating your account...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}