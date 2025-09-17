import { NextRequest, NextResponse } from "next/server";
import { serverFirestoreService } from "@/lib/firebase/server-mock-auth";

/**
 * Comprehensive Firebase Test Endpoint
 * 
 * This endpoint tests the entire Firebase integration flow:
 * 1. User authentication check
 * 2. Project creation
 * 3. Visual creation
 * 4. Usage tracking
 * 5. Storage operations (mock)
 * 
 * Use this endpoint to debug Firebase collection creation issues.
 */
export async function POST(request: NextRequest) {
  const testResults: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 0
    }
  };

  function addTest(name: string, success: boolean, data?: any, error?: any) {
    testResults.tests.push({
      name,
      success,
      data,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      timestamp: new Date().toISOString()
    });
    
    if (success) {
      testResults.summary.passed++;
    } else {
      testResults.summary.failed++;
    }
    testResults.summary.total++;
    
    console.log(`[Firebase Test] ${name}: ${success ? 'PASS' : 'FAIL'}`, success ? data : error);
  }

  try {
    // Get user ID from headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({
        error: 'User ID required in x-user-id header',
        instructions: 'Send authenticated request with x-user-id header containing Firebase user UID'
      }, { status: 400 });
    }

    console.log(`[Firebase Test] Starting comprehensive Firebase test for user: ${userId}`);

    // Test 1: Check if user exists and has proper data structure
    try {
      console.log('[Firebase Test] Testing user data retrieval...');
      
      // First ensure user document exists with real user data
      await serverFirestoreService.ensureUserDocument(userId, {
        email: `user-${userId}@piktor.app`, // Use real-looking email
        displayName: 'Real User'
      });
      
      const userData = await serverFirestoreService.getUserData(userId);
      addTest('User Data Retrieval', true, {
        userId,
        email: userData.email,
        hasUsage: !!userData.usage,
        creditsUsed: userData.usage?.creditsUsed,
        creditsTotal: userData.usage?.creditsTotal
      });
    } catch (error) {
      addTest('User Data Retrieval', false, null, error);
    }

    // Test 2: Check credits availability
    try {
      console.log('[Firebase Test] Testing credits check...');
      const hasCredits = await serverFirestoreService.hasCredits(userId, 1);
      addTest('Credits Check', true, { hasCredits, creditsNeeded: 1 });
    } catch (error) {
      addTest('Credits Check', false, null, error);
    }

    // Test 3: Create a test project
    let testProjectId: string | null = null;
    try {
      console.log('[Firebase Test] Testing project creation...');
      const projectData = {
        name: `Firebase Test Project - ${new Date().toISOString()}`,
        description: 'Test project created by Firebase test endpoint',
        category: 'test',
        defaultStyle: 'modern',
        defaultEnvironment: 'minimal',
        preferredFormats: ['square']
      };
      
      testProjectId = await serverFirestoreService.createProject(userId, projectData);
      addTest('Project Creation', true, { 
        projectId: testProjectId,
        projectName: projectData.name 
      });
    } catch (error) {
      addTest('Project Creation', false, null, error);
    }

    // Test 4: Retrieve the created project
    if (testProjectId) {
      try {
        console.log('[Firebase Test] Testing project retrieval...');
        const project = await serverFirestoreService.getProject(testProjectId);
        addTest('Project Retrieval', !!project, project ? {
          id: project.id,
          name: project.name,
          userId: project.userId
        } : null);
      } catch (error) {
        addTest('Project Retrieval', false, null, error);
      }
    }

    // Test 5: Get user's projects
    try {
      console.log('[Firebase Test] Testing user projects query...');
      const userProjects = await serverFirestoreService.getUserProjects(userId, { limit: 5 });
      addTest('User Projects Query', true, {
        projectsCount: userProjects.data.length,
        hasMore: userProjects.hasMore,
        projects: userProjects.data.map(p => ({ id: p.id, name: p.name }))
      });
    } catch (error) {
      addTest('User Projects Query', false, null, error);
    }

    // Test 6: Test visual creation with mock data
    let testVisualId: string | null = null;
    if (testProjectId) {
      try {
        console.log('[Firebase Test] Testing visual creation...');
        
        // Create mock visual data (without actual file upload)
        const mockVisualData = {
          userId,
          projectId: testProjectId,
          name: 'Test Visual - Firebase Integration Test',
          description: 'Mock visual created by Firebase test endpoint',
          originalImageUrl: 'https://via.placeholder.com/1024x1024/FF6B6B/FFFFFF?text=TEST',
          thumbnailUrl: 'https://via.placeholder.com/256x256/FF6B6B/FFFFFF?text=TEST',
          downloadUrls: {
            square: 'https://via.placeholder.com/1024x1024/FF6B6B/FFFFFF?text=TEST'
          },
          prompt: 'Test prompt for Firebase integration testing',
          style: 'modern',
          environment: 'minimal',
          format: ['square'],
          generationParams: {
            model: 'test-model',
            timestamp: new Date().toISOString()
          },
          tags: ['test', 'firebase', 'integration'],
          colors: ['#FF6B6B', '#FFFFFF'],
          dimensions: { width: 1024, height: 1024 },
          fileSize: 102400,
          mimeType: 'image/png',
          views: 0,
          downloads: 0,
          shares: 0,
          isFavorite: false,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        };

        testVisualId = await serverFirestoreService.createVisual(mockVisualData);
        addTest('Visual Creation', true, {
          visualId: testVisualId,
          visualName: mockVisualData.name
        });
      } catch (error) {
        addTest('Visual Creation', false, null, error);
      }
    }

    // Test 7: Retrieve the created visual
    if (testVisualId) {
      try {
        console.log('[Firebase Test] Testing visual retrieval...');
        const visual = await serverFirestoreService.getVisual(testVisualId);
        addTest('Visual Retrieval', !!visual, visual ? {
          id: visual.id,
          name: visual.name,
          userId: visual.userId,
          projectId: visual.projectId
        } : null);
      } catch (error) {
        addTest('Visual Retrieval', false, null, error);
      }
    }

    // Test 8: Get user's visuals
    try {
      console.log('[Firebase Test] Testing user visuals query...');
      const userVisuals = await serverFirestoreService.getUserVisuals(userId, undefined, undefined, { limit: 5 });
      addTest('User Visuals Query', true, {
        visualsCount: userVisuals.data.length,
        hasMore: userVisuals.hasMore,
        visuals: userVisuals.data.map(v => ({ id: v.id, name: v.name, projectId: v.projectId }))
      });
    } catch (error) {
      addTest('User Visuals Query', false, null, error);
    }

    // Test 9: Dashboard stats
    try {
      console.log('[Firebase Test] Testing dashboard stats...');
      const dashboardStats = await serverFirestoreService.getDashboardStats(userId);
      addTest('Dashboard Stats', true, dashboardStats);
    } catch (error) {
      addTest('Dashboard Stats', false, null, error);
    }

    // Test 10: Recent projects
    try {
      console.log('[Firebase Test] Testing recent projects...');
      const recentProjects = await serverFirestoreService.getRecentProjects(userId, 3);
      addTest('Recent Projects', true, {
        projectsCount: recentProjects.length,
        projects: recentProjects.map(p => ({ id: p.id, name: p.name }))
      });
    } catch (error) {
      addTest('Recent Projects', false, null, error);
    }

    // Cleanup: Delete test project and visuals if created
    if (testProjectId) {
      try {
        console.log('[Firebase Test] Cleaning up test project...');
        await serverFirestoreService.deleteProject(testProjectId);
        addTest('Cleanup - Delete Test Project', true, { projectId: testProjectId });
      } catch (error) {
        addTest('Cleanup - Delete Test Project', false, null, error);
      }
    }

    console.log(`[Firebase Test] Test completed. Passed: ${testResults.summary.passed}/${testResults.summary.total}`);

    return NextResponse.json({
      success: testResults.summary.failed === 0,
      message: `Firebase integration test completed. ${testResults.summary.passed}/${testResults.summary.total} tests passed.`,
      results: testResults,
      recommendations: generateRecommendations(testResults)
    });

  } catch (error) {
    console.error('[Firebase Test] Test execution error:', error);
    
    return NextResponse.json({
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      results: testResults
    }, { status: 500 });
  }
}

function generateRecommendations(testResults: any): string[] {
  const recommendations: string[] = [];
  const failedTests = testResults.tests.filter((t: any) => !t.success);
  
  if (failedTests.length === 0) {
    recommendations.push('✅ All Firebase integration tests passed! Collections should be created successfully.');
    return recommendations;
  }

  // Analyze failures and provide specific recommendations
  failedTests.forEach((test: any) => {
    switch (test.name) {
      case 'User Data Retrieval':
        recommendations.push('❌ User document not found. Ensure user is properly authenticated and user document exists in Firestore.');
        break;
      case 'Credits Check':
        recommendations.push('❌ Credits check failed. Verify user document has proper usage structure.');
        break;
      case 'Project Creation':
        recommendations.push('❌ Project creation failed. Check Firestore rules and ensure collections can be created.');
        break;
      case 'Visual Creation':
        recommendations.push('❌ Visual creation failed. This is likely the main issue preventing collections from appearing.');
        break;
    }
  });

  if (failedTests.some((t: any) => t.name.includes('Creation'))) {
    recommendations.push('🔧 Check Firebase Firestore rules - ensure authenticated users can create documents in the required collections.');
    recommendations.push('🔧 Verify Firebase configuration is correct and all required environment variables are set.');
    recommendations.push('🔧 Check console logs for detailed error messages about specific collection creation failures.');
  }

  return recommendations;
}

export async function GET() {
  return NextResponse.json({
    message: 'Firebase Test Endpoint',
    usage: 'POST with x-user-id header containing Firebase user UID to run comprehensive Firebase integration tests',
    purpose: 'Diagnose Firebase collection creation issues and verify complete integration flow'
  });
}