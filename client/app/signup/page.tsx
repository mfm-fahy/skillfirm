"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"

const avatarOptions = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=2", 
  "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=6"
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
  const [progress, setProgress] = useState(20)
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
      developCurrent: null as boolean | null
    }
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [careerFields, setCareerFields] = useState<string[]>([])
  const [psychometricTest, setPsychometricTest] = useState<PsychometricQuestion[]>([])
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [tempUserId, setTempUserId] = useState("")

  useEffect(() => {
    fetchCareerFields()
  }, [])

  const fetchCareerFields = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/career-fields')
      const data = await response.json()
      setCareerFields(data.fields)
    } catch (error) {
      console.error('Failed to fetch career fields:', error)
    }
  }

  const fetchPsychometricTest = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/psychometric-test')
      const data = await response.json()
      setPsychometricTest(data.test.questions || [])
    } catch (error) {
      console.error('Failed to fetch psychometric test:', error)
    }
  }

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/register/basic', {
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
      setProgress(40)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUserTypeSubmit = async (userType: string) => {
    if (!formData.password) {
      setError("Please enter a password")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/usertype', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempUserId, userType, password: formData.password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      setFormData({...formData, userType})
      setStep(3)
      setProgress(60)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSchoolAnalysis = async (hasIdea: boolean, field?: string) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/school-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tempUserId, 
          hasCareerIdea: hasIdea, 
          selectedField: field 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      setFormData({...formData, hasCareerIdea: hasIdea, selectedField: field || ""})
      
      if (data.nextStep === 'psychometric') {
        await fetchPsychometricTest()
        setStep(4)
        setProgress(80)
      } else if (data.analysis) {
        setAnalysisResult(data.analysis)
        setStep(5)
        setProgress(90)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCollegeAnalysis = async (field: string) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/college-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempUserId, selectedField: field })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      setFormData({...formData, selectedField: field})
      setAnalysisResult(data.analysis)
      setStep(5)
      setProgress(90)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeFieldSwitch = async (currentField: string, targetField: string) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/employee-field-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tempUserId, 
          currentField, 
          targetField 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      setFormData({
        ...formData, 
        selectedField: targetField,
        employeeInfo: { ...formData.employeeInfo, currentField, wantToSwitch: true }
      })
      setAnalysisResult(data.analysis)
      setStep(5)
      setProgress(90)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeAnalysis = async (currentField: string, wantToSwitch: boolean, developCurrent: boolean) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/employee-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tempUserId, 
          currentField, 
          wantToSwitch, 
          developCurrent 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      setFormData({
        ...formData, 
        employeeInfo: { currentField, wantToSwitch, developCurrent }
      })
      setAnalysisResult(data.suggestions)
      setStep(5)
      setProgress(90)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePsychometricSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/psychometric-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tempUserId, 
          answers: formData.psychometricAnswers 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      setAnalysisResult(data.results)
      setStep(5)
      setProgress(90)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const completeRegistration = async (selectedOption?: string) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/complete', {
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
      
      setProgress(100)
      router.push('/')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Basic Information
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Create Your Account</CardTitle>
            <p className="text-center text-gray-600">Step 1: Basic Information</p>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBasicSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <Label>Degree Status *</Label>
                <RadioGroup 
                  value={formData.degree.status} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    degree: {...formData.degree, status: value as "pursuing" | "completed"}
                  })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pursuing" id="pursuing" />
                    <Label htmlFor="pursuing">Currently Pursuing</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="completed" id="completed" />
                    <Label htmlFor="completed">Completed</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="degreeName">Degree/Course Name *</Label>
                <Input
                  id="degreeName"
                  required
                  value={formData.degree.name}
                  onChange={(e) => setFormData({
                    ...formData, 
                    degree: {...formData.degree, name: e.target.value}
                  })}
                  placeholder="e.g., Computer Science, 12th Grade"
                />
              </div>

              <div>
                <Label htmlFor="schoolGroup">School Group (if studying in school)</Label>
                <Select 
                  value={formData.schoolGroup} 
                  onValueChange={(value) => setFormData({...formData, schoolGroup: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select school group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="commerce">Commerce</SelectItem>
                    <SelectItem value="arts">Arts/Humanities</SelectItem>
                    <SelectItem value="vocational">Vocational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Choose Avatar *</Label>
                <div className="grid grid-cols-6 gap-4 mt-2">
                  {avatarOptions.map((avatar, index) => (
                    <Avatar
                      key={index}
                      className={`cursor-pointer border-2 ${
                        formData.avatar === avatar ? 'border-blue-500' : 'border-gray-200'
                      }`}
                      onClick={() => setFormData({...formData, avatar})}
                    >
                      <AvatarImage src={avatar} />
                      <AvatarFallback>A{index + 1}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="additionalDetails">Additional Details</Label>
                <Textarea
                  id="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={(e) => setFormData({...formData, additionalDetails: e.target.value})}
                  placeholder="Any additional information you'd like to share"
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#5170ff] hover:bg-[#4160ef]"
              >
                {loading ? "Saving..." : "Next"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: User Type Selection
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Choose Your Path</CardTitle>
            <p className="text-center text-gray-600">Step 2: Tell us about yourself</p>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <div className="mb-6">
              <Label htmlFor="password">Create Password *</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter a secure password"
              />
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => handleUserTypeSubmit('school')}
                disabled={loading || !formData.password}
                className="w-full h-20 text-lg bg-green-500 hover:bg-green-600"
              >
                <div className="text-center">
                  <div className="font-semibold">School Student</div>
                  <div className="text-sm opacity-80">Get career guidance and explore your interests</div>
                </div>
              </Button>

              <Button
                onClick={() => handleUserTypeSubmit('college')}
                disabled={loading || !formData.password}
                className="w-full h-20 text-lg bg-blue-500 hover:bg-blue-600"
              >
                <div className="text-center">
                  <div className="font-semibold">College Student</div>
                  <div className="text-sm opacity-80">Analyze your field and plan your career</div>
                </div>
              </Button>

              <Button
                onClick={() => handleUserTypeSubmit('employee')}
                disabled={loading || !formData.password}
                className="w-full h-20 text-lg bg-purple-500 hover:bg-purple-600"
              >
                <div className="text-center">
                  <div className="font-semibold">Working Professional</div>
                  <div className="text-sm opacity-80">Switch fields or develop in your current career</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 3: Career Analysis based on user type
  if (step === 3) {
    if (formData.userType === 'school') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Career Exploration</CardTitle>
              <p className="text-center text-gray-600">Do you have any idea about your future career?</p>
              <Progress value={progress} className="w-full" />
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">Do you have any idea about your future career?</h3>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => setFormData({...formData, hasCareerIdea: true})}
                    className="w-full h-16 text-lg bg-green-500 hover:bg-green-600"
                  >
                    Yes, I have some ideas
                  </Button>

                  <Button
                    onClick={() => handleSchoolAnalysis(false)}
                    disabled={loading}
                    className="w-full h-16 text-lg bg-blue-500 hover:bg-blue-600"
                  >
                    {loading ? "Loading..." : "No, I need guidance"}
                  </Button>
                </div>

                {formData.hasCareerIdea === true && (
                  <div className="mt-6 space-y-4">
                    <Label>Enter your field of interest:</Label>
                    <Input
                      value={formData.selectedField}
                      onChange={(e) => setFormData({...formData, selectedField: e.target.value})}
                      placeholder="e.g. Software Development, Digital Marketing, Healthcare"
                    />

                    <Button
                      onClick={() => handleSchoolAnalysis(true, formData.selectedField)}
                      disabled={loading || !formData.selectedField.trim()}
                      className="w-full bg-[#5170ff] hover:bg-[#4160ef]"
                    >
                      {loading ? "Analyzing..." : "Analyze Field"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (formData.userType === 'college') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Field Analysis</CardTitle>
              <p className="text-center text-gray-600">Tell us about your field of study</p>
              <Progress value={progress} className="w-full" />
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <Label>What field are you studying?</Label>
                  <Input
                    value={formData.selectedField}
                    onChange={(e) => setFormData({...formData, selectedField: e.target.value})}
                    placeholder="e.g. Computer Science, Business Administration, Mechanical Engineering"
                  />
                </div>

                <Button
                  onClick={() => handleCollegeAnalysis(formData.selectedField)}
                  disabled={loading || !formData.selectedField.trim()}
                  className="w-full bg-[#5170ff] hover:bg-[#4160ef]"
                >
                  {loading ? "Analyzing..." : "Analyze My Field"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (formData.userType === 'employee') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Career Development</CardTitle>
              <p className="text-center text-gray-600">Tell us about your current career</p>
              <Progress value={progress} className="w-full" />
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <Label>What field are you currently working in?</Label>
                  <Input
                    value={formData.employeeInfo.currentField}
                    onChange={(e) => setFormData({
                      ...formData, 
                      employeeInfo: {...formData.employeeInfo, currentField: e.target.value}
                    })}
                    placeholder="e.g. Software Development, Marketing, Finance"
                  />
                </div>

                <div className="space-y-4">
                  <Label>What would you like to do?</Label>
                  
                  <Button
                    onClick={() => {
                      setFormData({
                        ...formData, 
                        employeeInfo: {...formData.employeeInfo, wantToSwitch: true, developCurrent: false}
                      })
                    }}
                    className={`w-full h-16 text-lg ${
                      formData.employeeInfo.wantToSwitch === true 
                        ? 'bg-blue-600' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    Switch to a different field
                  </Button>

                  <Button
                    onClick={() => {
                      handleEmployeeAnalysis(
                        formData.employeeInfo.currentField,
                        false,
                        true
                      )
                    }}
                    disabled={loading || !formData.employeeInfo.currentField.trim()}
                    className="w-full h-16 text-lg bg-green-500 hover:bg-green-600"
                  >
                    {loading ? "Analyzing..." : "Develop in my current field"}
                  </Button>
                </div>

                {formData.employeeInfo.wantToSwitch === true && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <Label>Which field would you like to switch to?</Label>
                    <Input
                      value={formData.selectedField}
                      onChange={(e) => setFormData({...formData, selectedField: e.target.value})}
                      placeholder="e.g. Data Science, Digital Marketing, Product Management"
                    />
                    <Button
                      onClick={() => handleEmployeeFieldSwitch(
                        formData.employeeInfo.currentField,
                        formData.selectedField
                      )}
                      disabled={loading || !formData.selectedField.trim()}
                      className="w-full bg-[#5170ff] hover:bg-[#4160ef]"
                    >
                      {loading ? "Analyzing Switch..." : "Analyze Field Switch"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // Step 4: Psychometric Test (for school students who don't have career ideas)
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Psychometric Assessment</CardTitle>
            <p className="text-center text-gray-600">Answer these questions to discover your ideal career path</p>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <div className="space-y-8">
              {psychometricTest.map((question) => (
                <div key={question.id} className="space-y-4">
                  <h3 className="text-lg font-semibold">{question.id}. {question.question}</h3>
                  <RadioGroup
                    value={formData.psychometricAnswers[question.id] || ""}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      psychometricAnswers: {
                        ...formData.psychometricAnswers,
                        [question.id]: value
                      }
                    })}
                  >
                    {question.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`q${question.id}_${index}`} />
                        <Label htmlFor={`q${question.id}_${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}

              <Button
                onClick={handlePsychometricSubmit}
                disabled={loading || Object.keys(formData.psychometricAnswers).length < psychometricTest.length}
                className="w-full bg-[#5170ff] hover:bg-[#4160ef]"
              >
                {loading ? "Analyzing Results..." : "Complete Assessment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 5: Results and Completion
  if (step === 5) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Your Career Analysis</CardTitle>
            <p className="text-center text-gray-600">Based on our analysis, here are your recommendations</p>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {analysisResult && (
                <div className="space-y-4">
                  {/* Field Switching Analysis */}
                  {analysisResult.targetField && (
                    <div className={`p-6 rounded-lg ${
                      analysisResult.targetField.value === 'Low' ? 'bg-red-50 border border-red-200' : 'bg-orange-50'
                    }`}>
                      <h3 className="text-xl font-semibold mb-4">
                        Field Switch Analysis: {analysisResult.targetField.field}
                        {analysisResult.targetField.value === 'Low' && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-sm rounded">⚠️ Low Market Value</span>
                        )}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p><strong>Target Field Value:</strong> 
                            <span className={analysisResult.targetField.value === 'Low' ? 'text-red-600 font-semibold' : ''}>
                              {analysisResult.targetField.value}
                            </span>
                          </p>
                          <p><strong>Growth Potential:</strong> {analysisResult.targetField.growth}</p>
                          <p><strong>Salary Range:</strong> {analysisResult.targetField.salary}</p>
                        </div>
                        <div>
                          <p><strong>Required Skills:</strong></p>
                          <ul className="list-disc list-inside text-sm">
                            {analysisResult.targetField.skills?.map((skill: string, index: number) => (
                              <li key={index}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {analysisResult.targetField.alternatives?.length > 0 && (
                        <div className={`mt-4 p-4 rounded border ${
                          analysisResult.targetField.value === 'Low' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <p className="font-semibold mb-2">
                            {analysisResult.targetField.value === 'Low' 
                              ? '💡 Better Alternative Fields to Consider:' 
                              : 'Related Fields:'}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {analysisResult.targetField.alternatives.map((alt: string, index: number) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setFormData({...formData, selectedField: alt})
                                  handleEmployeeFieldSwitch(formData.employeeInfo.currentField, alt)
                                }}
                                disabled={loading}
                                className={`p-2 text-left rounded border hover:bg-opacity-80 ${
                                  analysisResult.targetField.value === 'Low'
                                    ? 'bg-green-100 border-green-300 hover:bg-green-200'
                                    : 'bg-blue-100 border-blue-300 hover:bg-blue-200'
                                }`}
                              >
                                {loading ? 'Analyzing...' : alt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysisResult.switchingPath && (
                        <div className="mt-4 p-4 bg-white rounded border">
                          <h4 className="font-semibold mb-2">Transition Plan</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Difficulty:</strong> {analysisResult.switchingPath.difficulty}</p>
                              <p><strong>Timeline:</strong> {analysisResult.switchingPath.timeline}</p>
                            </div>
                            <div>
                              <p><strong>Transferable Skills:</strong></p>
                              <ul className="list-disc list-inside">
                                {analysisResult.switchingPath.transferableSkills?.map((skill: string, index: number) => (
                                  <li key={index}>{skill}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          {analysisResult.switchingPath.transitionSteps && (
                            <div className="mt-3">
                              <p><strong>Recommended Steps:</strong></p>
                              <ol className="list-decimal list-inside text-sm">
                                {analysisResult.switchingPath.transitionSteps.map((step: string, index: number) => (
                                  <li key={index}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Field Analysis Results */}
                  {analysisResult.hasValue !== undefined && (
                    <div className={`p-6 rounded-lg ${
                      analysisResult.value === 'Low' ? 'bg-red-50 border border-red-200' : 'bg-blue-50'
                    }`}>
                      <h3 className="text-xl font-semibold mb-4">
                        Field Analysis: {formData.selectedField}
                        {analysisResult.value === 'Low' && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-sm rounded">⚠️ Low Market Value</span>
                        )}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p><strong>Future Value:</strong> 
                            <span className={analysisResult.value === 'Low' ? 'text-red-600 font-semibold' : ''}>
                              {analysisResult.value}
                            </span>
                          </p>
                          <p><strong>Growth Potential:</strong> {analysisResult.growth}</p>
                          <p><strong>Salary Range:</strong> {analysisResult.salary}</p>
                        </div>
                        <div>
                          <p><strong>Required Skills:</strong></p>
                          <ul className="list-disc list-inside">
                            {analysisResult.skills?.map((skill: string, index: number) => (
                              <li key={index}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {analysisResult.alternatives?.length > 0 && (
                        <div className={`mt-4 p-4 rounded border ${
                          analysisResult.value === 'Low' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <p className="font-semibold mb-2">
                            {analysisResult.value === 'Low' 
                              ? '💡 Recommended Alternative Fields with Better Prospects:' 
                              : 'Related Fields to Consider:'}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {analysisResult.alternatives.map((alt: string, index: number) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setFormData({...formData, selectedField: alt})
                                  if (formData.userType === 'school') {
                                    handleSchoolAnalysis(true, alt)
                                  } else if (formData.userType === 'college') {
                                    handleCollegeAnalysis(alt)
                                  }
                                }}
                                disabled={loading}
                                className={`p-2 text-left rounded border hover:bg-opacity-80 ${
                                  analysisResult.value === 'Low'
                                    ? 'bg-green-100 border-green-300 hover:bg-green-200'
                                    : 'bg-blue-100 border-blue-300 hover:bg-blue-200'
                                }`}
                              >
                                {loading ? 'Analyzing...' : alt}
                              </button>
                            ))}
                          </div>
                          {analysisResult.value === 'Low' && (
                            <p className="text-sm text-green-700 mt-2">
                              💡 Click on any alternative field above to analyze it instead
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Psychometric Results */}
                  {analysisResult.suggestedFields && (
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold mb-4">Recommended Career Fields</h3>
                      <div className="space-y-3">
                        {analysisResult.suggestedFields.map((field: any, index: number) => (
                          <div key={index} className="bg-white p-4 rounded border">
                            <h4 className="font-semibold">{field.field}</h4>
                            <p className="text-sm text-gray-600">{field.reason}</p>
                            <p className="text-sm font-medium">Match Score: {field.score}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Employee Suggestions */}
                  {analysisResult.alternatives && (
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold mb-4">Career Suggestions</h3>
                      <div className="space-y-3">
                        {analysisResult.alternatives.map((suggestion: any, index: number) => (
                          <div key={index} className="bg-white p-4 rounded border">
                            <h4 className="font-semibold">{suggestion.field}</h4>
                            <p className="text-sm text-gray-600">Difficulty: {suggestion.transition_difficulty || suggestion.difficulty || 'Not specified'}</p>
                            <p className="text-sm text-gray-600">Timeline: {suggestion.timeline || 'Not specified'}</p>
                            <p className="text-sm">Skills needed: {suggestion.required_skills?.join(', ') || suggestion.skills?.join(', ') || 'Not specified'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="text-center">
                {analysisResult && (analysisResult.suggestedFields || analysisResult.alternatives || analysisResult.development) && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">Select your preferred field:</h4>
                    <div className="space-y-2">
                      {analysisResult.suggestedFields?.map((field: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => completeRegistration(field.field)}
                          disabled={loading}
                          className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300"
                        >
                          <div className="font-medium">{field.field}</div>
                          <div className="text-sm text-gray-600">{field.reason}</div>
                        </button>
                      ))}
                      {analysisResult.alternatives?.map((alt: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => completeRegistration(alt.field)}
                          disabled={loading}
                          className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300"
                        >
                          <div className="font-medium">{alt.field}</div>
                          <div className="text-sm text-gray-600">Difficulty: {alt.difficulty}</div>
                        </button>
                      ))}
                      {analysisResult.development?.map((dev: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => completeRegistration(dev.path)}
                          disabled={loading}
                          className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300"
                        >
                          <div className="font-medium">{dev.path}</div>
                          <div className="text-sm text-gray-600">{dev.outcome}</div>
                        </button>
                      ))}
                      {formData.selectedField && (
                        <button
                          onClick={() => completeRegistration(formData.selectedField)}
                          disabled={loading}
                          className="w-full p-3 text-left border rounded-lg hover:bg-green-50 hover:border-green-300"
                        >
                          <div className="font-medium">{formData.selectedField}</div>
                          <div className="text-sm text-gray-600">Your original choice</div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <Button
                  onClick={() => completeRegistration()}
                  disabled={loading}
                  className="w-full bg-[#5170ff] hover:bg-[#4160ef] text-lg py-3"
                >
                  {loading ? "Completing Registration..." : "Skip Selection & Enter App"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}